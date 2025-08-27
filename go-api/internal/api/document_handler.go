package api

import (
	"encoding/json"
	"fmt"
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

type DocumentId struct {
	DocumentId string `json:"id"`
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
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create document"})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"document": createdDocument})
}

func (dh *DocumentHandler) HandleReadDocument(w http.ResponseWriter, r *http.Request) {
	var documentId DocumentId
	err := json.NewDecoder(r.Body).Decode(&documentId)
	if err != nil {
		dh.logger.Printf("ERROR: decodingReadDocument: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	fmt.Println(documentId)
	document, err := dh.documentStore.ReadDocument(documentId.DocumentId)
	if err != nil {
		dh.logger.Printf("ERROR: readDocument: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to read document"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"document": document})
}

func (dh *DocumentHandler) HandleUpdateDocument(w http.ResponseWriter, r *http.Request) {
	var document store.Document
	err := json.NewDecoder(r.Body).Decode(&document)
	if err != nil {
		dh.logger.Printf("ERROR: decodingUpdateDocument: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	updatedDocument, err := dh.documentStore.UpdateDocument(&document)
	if err != nil {
		dh.logger.Printf("ERROR: updateDocument: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to update document"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"document": updatedDocument})
}

func (dh *DocumentHandler) HandleDeleteDocument(w http.ResponseWriter, r *http.Request) {
	documentID, err := utils.ReadStringParam(r)

	if err != nil {
		dh.logger.Printf("ERROR: readDocumentIDParam: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	err = dh.documentStore.DeleteDocument(documentID)
	if err != nil {
		dh.logger.Printf("ERROR: deleteDocument: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to delete document"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"result": "document deleted"})
}

func (dh *DocumentHandler) HandleGetAllDocuments(w http.ResponseWriter, r *http.Request) {
	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	documents, err := dh.documentStore.GetAllDocuments(currentUser)
	if err != nil {
		dh.logger.Printf("ERROR: getAllDocuments: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to get documents"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"documents": documents})
}
