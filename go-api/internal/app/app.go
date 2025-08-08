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

	userHandler := api.NewUserHandler(userStore, logger)
	documentHandler := api.NewDocumentHandler(documentStore, logger)
	middlewareHandler := middleware.UserMiddleware{UserStore: userStore}

	app := &Application{
		Logger:          logger,
		DB:              db,
		UserHandler:     userHandler,
		DocumentHandler: documentHandler,
		Middleware:      middlewareHandler,
	}

	return app, nil
}

func (a *Application) HealthCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Status is available\n")
}
