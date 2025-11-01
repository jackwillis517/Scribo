package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackwillis517/Scribo/internal/app"
)

func SetupRoutes(app *app.Application) *chi.Mux {
	r := chi.NewRouter()
	r.Use(app.Middleware.CORSMiddleware)

	r.Group(func(r chi.Router) {
		r.Use(app.Middleware.Authenticate)

		r.Get("/user/getUser", app.UserHandler.HandleGetUser)

		r.Post("/documents/createDocument", app.DocumentHandler.HandleCreateDocument)
		r.Post("/documents/readDocument", app.DocumentHandler.HandleReadDocument)
		r.Put("/documents/updateDocument", app.DocumentHandler.HandleUpdateDocument)
		r.Delete("/documents/deleteDocument/{id}", app.DocumentHandler.HandleDeleteDocument)
		r.Get("/documents/getAllDocuments", app.DocumentHandler.HandleGetAllDocuments)

		r.Post("/sections/createSection", app.SectionHandler.HandleCreateSection)
		r.Post("/sections/readSection", app.SectionHandler.HandleReadSection)
		r.Put("/sections/updateSection", app.SectionHandler.HandleUpdateSection)
		r.Delete("/sections/deleteSection/{id}", app.SectionHandler.HandleDeleteSection)
		r.Post("/sections/getSectionsForDocument", app.SectionHandler.HandleGetSectionsForDocument)

		r.Post("/agent/message", app.AgentHandler.HandleAgentMessage)
		r.Post("/agent/saveSection", app.AgentHandler.HandleSaveSection)
		r.Post("/agent/getMessagesById", app.AgentHandler.HandleGetMessagesById)

		// /notes/...
	})

	r.Get("/health", app.HealthCheck)
	r.Post("/login", app.UserHandler.HandleUserLogin)
	r.Post("/user/invalidateUser", app.UserHandler.HandleInvalidateUser)
	return r
}
