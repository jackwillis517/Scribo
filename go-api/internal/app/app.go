package app

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/jackwillis517/Scribo/internal/api"
	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/joho/godotenv"
)

type Application struct {
	Logger          *log.Logger
	DB              *sql.DB
	UserHandler     *api.UserHandler
	DocumentHandler *api.DocumentHandler
	SectionHandler  *api.SectionHandler
	NoteHandler     *api.NoteHandler
	Middleware      middleware.UserMiddleware
}

func NewApplication() (*Application, error) {
	// Load the .env file
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Define a logger for our app
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	databaseUrl := os.Getenv("DATABASE_URL")
	db, err := store.Open(databaseUrl)
	if err != nil {
		panic(err)
	}

	userStore := store.NewPostgresUserStore(db)
	documentStore := store.NewPostgresDocumentStore(db)
	sectionStore := store.NewPostgresSectionStore(db)
	noteStore := store.NewPostgresNoteStore(db)

	userHandler := api.NewUserHandler(userStore, logger)
	documentHandler := api.NewDocumentHandler(documentStore, logger)
	sectionHandler := api.NewSectionHandler(sectionStore, logger)
	noteHandler := api.NewNoteHandler(noteStore, logger)
	middlewareHandler := middleware.UserMiddleware{UserStore: userStore}

	app := &Application{
		Logger:          logger,
		DB:              db,
		UserHandler:     userHandler,
		DocumentHandler: documentHandler,
		SectionHandler:  sectionHandler,
		NoteHandler:     noteHandler,
		Middleware:      middlewareHandler,
	}

	return app, nil
}

func (a *Application) HealthCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Status is available\n")
}
