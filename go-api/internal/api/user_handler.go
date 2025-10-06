package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type UserHandler struct {
	userStore store.UserStore
	logger    *log.Logger
}

func NewUserHandler(userStore store.UserStore, logger *log.Logger) *UserHandler {
	return &UserHandler{
		userStore: userStore,
		logger:    logger,
	}
}

func generateJWT(userID string) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	jwtSecretBytes := []byte(jwtSecret)
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecretBytes)
}

type GoogleTokenResponse struct {
	IdToken      string `json:"id_token"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresIn    int    `json:"expires_in,omitempty"`
	TokenType    string `json:"token_type,omitempty"`
}

// ExchangeCodeAndGetUser exchanges the auth code for an ID token and returns a parsed user.
func ExchangeCodeAndGetUser(authCode string) (*store.User, error) {
	clientID := os.Getenv("GOOGLE_OAUTH_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_OAUTH_REDIRECT_URL")

	data := url.Values{}
	data.Set("code", authCode)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.Post(
		"https://oauth2.googleapis.com/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		return nil, err
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tokenResp GoogleTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}
	if tokenResp.IdToken == "" {
		return nil, errors.New("no id_token in response")
	}

	token, _, err := new(jwt.Parser).ParseUnverified(tokenResp.IdToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims type")
	}

	user := &store.User{
		GoogleID: getStringClaim(claims, "sub"),
		Email:    getStringClaim(claims, "email"),
		Name:     getStringClaim(claims, "name"),
		Picture:  getStringClaim(claims, "picture"),
	}

	return user, nil
}

func getStringClaim(claims jwt.MapClaims, key string) string {
	if val, ok := claims[key]; ok {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}

func (u *UserHandler) HandleUserLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"id_token"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	user, err := ExchangeCodeAndGetUser(req.IDToken)
	if err != nil {
		fmt.Printf("ERROR: ExchangeCodeAndGetUser: %v\n", err)
		http.Error(w, "Invalid id_token", http.StatusUnauthorized)
	}

	// Query database for existing user
	foundUser, err := u.userStore.FindUserByGoogleID(user)
	if err != nil && err != sql.ErrNoRows {
		u.logger.Printf("ERROR: FindUserByGoogleID: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "bad user data"})
		return
	}

	// If user not found
	if err == sql.ErrNoRows {
		newUser, err := u.userStore.CreateUser(user)
		if err != nil {
			u.logger.Printf("ERROR: CreateUser: %v", err)
			utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "bad user data"})
			return
		}
		// Return jwt token using new user id
		tokenString, err := generateJWT(newUser.ID)
		if err != nil {
			u.logger.Printf("ERROR: generateJWT: %v", err)
			utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create JWT token"})
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "auth_token",
			Value:    tokenString,
			Path:     "/",
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Expires:  time.Now().Add(72 * time.Hour),
		})

		utils.WriteJSON(w, http.StatusAccepted, utils.Envelope{
			"google_id": user.GoogleID,
			"email":     user.Email,
			"name":      user.Name,
			"picture":   user.Picture,
		})
		return
	}

	// If user found
	tokenString, err := generateJWT(foundUser.ID)
	if err != nil {
		u.logger.Printf("ERROR: generateJWT: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create JWT token"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(72 * time.Hour),
	})

	utils.WriteJSON(w, http.StatusAccepted, utils.Envelope{
		"google_id": user.GoogleID,
		"email":     user.Email,
		"name":      user.Name,
		"picture":   user.Picture,
	})
}

func (u *UserHandler) HandleGetUser(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	utils.WriteJSON(w, http.StatusAccepted, utils.Envelope{
		"google_id": user.GoogleID,
		"email":     user.Email,
		"name":      user.Name,
		"picture":   user.Picture,
	})
}

func (u *UserHandler) HandleInvalidateUser(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(72 * time.Hour),
	})
}
