package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
	"google.golang.org/api/idtoken"
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

func validateIDToken(ctx context.Context, idToken string) (*idtoken.Payload, error) {
	clientID := os.Getenv("GOOGLE_OAUTH_CLIENT_ID")
	payload, err := idtoken.Validate(ctx, idToken, clientID)
	if err != nil {
		return nil, err
	}

	return payload, nil
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

func (u *UserHandler) HandleUserLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"id_token"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	payload, err := validateIDToken(r.Context(), req.IDToken)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		http.Error(w, "Invalid ID token", http.StatusUnauthorized)
		return
	}

	google_id := payload.Subject // "sub"
	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)
	picture := payload.Claims["picture"].(string)

	user := store.User{
		GoogleID: google_id,
		Email:    email,
		Name:     name,
		Picture:  picture,
	}

	// Query database for existing user
	foundUser, err := u.userStore.FindUserByGoogleID(&user)
	if err != nil && err != sql.ErrNoRows {
		u.logger.Printf("ERROR: FindUserByGoogleID: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "bad user data"})
		return
	}

	// If user not found
	if err == sql.ErrNoRows {
		newUser, err := u.userStore.CreateUser(&user)
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

		utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"token": tokenString})
		return
		// If user found
	}

	// Return jwt token using found user id
	tokenString, err := generateJWT(foundUser.ID)
	if err != nil {
		u.logger.Printf("ERROR: generateJWT: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create JWT token"})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"token": tokenString})
	fmt.Printf("User Created! Google Id Token: %v JWT Token: %v\n", req.IDToken, tokenString)
}
