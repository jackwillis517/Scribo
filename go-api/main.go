package main

import (
	"flag"
	"fmt"
	"net/http"
	"time"

	// "os"
	"github.com/jackwillis517/Scribo/internal/app"
	"github.com/jackwillis517/Scribo/internal/routes"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	// Parse optional server port argument default is 8081
	var port int
	flag.IntVar(&port, "port", 8081, "go api backend server port")
	flag.Parse()

	app, err := app.NewApplication()
	if err != nil {
		panic(err)
	}
	defer app.DB.Close()

	r := routes.SetupRoutes(app)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      r,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	app.Logger.Printf("we are running on port %d\n", port)

	err = server.ListenAndServe()
	if err != nil {
		app.Logger.Fatal(err)
	}
}
