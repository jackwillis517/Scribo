package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type UserMiddleware struct {
	UserStore store.UserStore
}

type contextKey string

const UserContextKey = contextKey("user")

func SetUser(r *http.Request, user *store.User) *http.Request {
	ctx := context.WithValue(r.Context(), UserContextKey, user)
	return r.WithContext(ctx)
}

func GetUser(r *http.Request) *store.User {
	user, ok := r.Context().Value(UserContextKey).(*store.User)
	if !ok {
		return nil
	}
	return user
}

func parseJWTToken(jwtToken string) (*jwt.Token, error) {
	token, err := jwt.Parse(jwtToken, func(t *jwt.Token) (interface{}, error) {

		secretKey := os.Getenv("JWT_SECRET")

		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}

		return []byte(secretKey), nil
	})

	return token, err
}

func (um *UserMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the JWT token from the auth_token cookie
		cookie, err := r.Cookie("auth_token")
		fmt.Println(cookie)
		if err != nil {
			if err == http.ErrNoCookie {
				utils.WriteJSON(w, http.StatusUnauthorized, utils.Envelope{"error": "unauthorized: missing auth token"})
			}

			utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "bad request"})
			return
		}

		// Parse the JWT token
		jwtToken := cookie.Value
		token, err := parseJWTToken(jwtToken)

		if err != nil || !token.Valid {
			fmt.Println(err)
			utils.WriteJSON(w, http.StatusUnauthorized, utils.Envelope{"error": "unauthorized: invalid auth token"})
			return
		}

		// Check the user_id claim in the token and set the user object in the request context
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID := claims["user_id"].(string)
			// Get user from the database
			user, err := um.UserStore.GetUserByID(userID)

			// Check if user is nil or error is nil
			if err != nil {
				utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "internal server error"})
				return
			}

			if user == nil {
				utils.WriteJSON(w, http.StatusUnauthorized, utils.Envelope{"error": "token expired or user not found"})
				return
			}

			// Set user in context
			r = SetUser(r, user)
			next.ServeHTTP(w, r)
		} else {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.Envelope{"error": "unauthorized: invalid token claims"})
			return
		}
	})
}
