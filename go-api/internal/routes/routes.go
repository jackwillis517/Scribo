package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackwillis517/Scribo/internal/app"
)

func SetupRoutes(app *app.Application) *chi.Mux {
	r := chi.NewRouter()

	r.Group(func(r chi.Router) {
		r.Use(app.Middleware.Authenticate)

		r.Post("/documents/createDocument", app.DocumentHandler.HandleCreateDocument)
		r.Get("/documents/readDocument", app.DocumentHandler.HandleReadDocument)
		r.Put("/documents/updateDocument", app.DocumentHandler.HandleUpdateDocument)
		r.Delete("/documents/deleteDocument/{id}", app.DocumentHandler.HandleDeleteDocument)
		r.Get("/documents/getAllDocuments", app.DocumentHandler.HandleGetAllDocuments)

		r.Post("/sections/createSection", app.SectionHandler.HandleCreateSection)
		r.Get("/sections/readSection", app.SectionHandler.HandleReadSection)
		r.Put("/sections/updateSection", app.SectionHandler.HandleUpdateSection)
		r.Delete("/sections/deleteSection/{id}", app.SectionHandler.HandleDeleteSection)
		r.Get("/sections/getAllSections", app.SectionHandler.HandleGetAllSections)

		r.Post("/agent/message", app.AgentHandler.HandleAgentMessage)

		// /notes/...
	})

	r.Get("/health", app.HealthCheck)
	r.Post("/login", app.UserHandler.HandleUserLogin)
	return r
}
