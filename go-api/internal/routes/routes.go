package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackwillis517/Scribo/internal/app"
)

func SetupRoutes(app *app.Application) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/health", app.HealthCheck)
	r.Post("/login", app.UserHandler.HandleUserLogin)

	// app.Middleware.Authenticate() is used to protect routes that require authentication
	// Need document, sections, and notes stores and handlers

	// /documents/createDocument
	// /documents/readDocument
	// /documents/updateDocument
	// /documents/deleteDocument

	// /sections/...

	// /notes/...
	return r
}
