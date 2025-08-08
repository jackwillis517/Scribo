package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type DocumentHandler struct {
	documentStore store.DocumentStore
	logger        *log.Logger
}

func NewDocumentHandler(documentStore store.DocumentStore, logger *log.Logger) *DocumentHandler {
	return &DocumentHandler{
		documentStore: documentStore,
		logger:        logger,
	}
}

func (dh *DocumentHandler) HandleCreateDocument(w http.ResponseWriter, r *http.Request) {
	var document store.Document
	err := json.NewDecoder(r.Body).Decode(&document)
	if err != nil {
		dh.logger.Printf("ERROR: decodingCreateDocument: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	document.UserID = currentUser.ID

	createdDocument, err := dh.documentStore.CreateDocument(&document, currentUser)
	if err != nil {
		dh.logger.Printf("ERROR: createWorkout: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create workout"})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"document": createdDocument})
}
