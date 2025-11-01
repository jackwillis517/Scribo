package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type SectionHandler struct {
	sectionStore store.SectionStore
	logger       *log.Logger
}

type SectionId struct {
	SectionId string `json:"id"`
}

func NewSectionHandler(sectionStore store.SectionStore, logger *log.Logger) *SectionHandler {
	return &SectionHandler{
		sectionStore: sectionStore,
		logger:       logger,
	}
}

func (sh *SectionHandler) HandleCreateSection(w http.ResponseWriter, r *http.Request) {
	var section store.Section
	err := json.NewDecoder(r.Body).Decode(&section)
	if err != nil {
		sh.logger.Printf("ERROR: decodingCreateSection: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	createdSection, err := sh.sectionStore.CreateSection(&section)
	if err != nil {
		sh.logger.Printf("ERROR: createSection: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create section"})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"section": createdSection})
}

func (sh *SectionHandler) HandleReadSection(w http.ResponseWriter, r *http.Request) {
	var sectionId SectionId
	err := json.NewDecoder(r.Body).Decode(&sectionId)
	if err != nil {
		sh.logger.Printf("ERROR: decodingReadSection: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	section, err := sh.sectionStore.ReadSection(sectionId.SectionId)
	if err != nil {
		sh.logger.Printf("ERROR: readDocument: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to read section"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"section": section})
}

func (sh *SectionHandler) HandleUpdateSection(w http.ResponseWriter, r *http.Request) {
	var section store.Section
	err := json.NewDecoder(r.Body).Decode(&section)
	if err != nil {
		sh.logger.Printf("ERROR: decodingUpdateSection: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	updatedSection, err := sh.sectionStore.UpdateSection(&section)
	if err != nil {
		sh.logger.Printf("ERROR: updateSection: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to update section"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"section": updatedSection})
}

func (sh *SectionHandler) HandleDeleteSection(w http.ResponseWriter, r *http.Request) {
	sectionID, err := utils.ReadStringParam(r)

	if err != nil {
		sh.logger.Printf("ERROR: readStringParam: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	err = sh.sectionStore.DeleteSection(sectionID)
	if err != nil {
		sh.logger.Printf("ERROR: deleteSection: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to delete section"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"result": "section deleted"})
}

func (sh *SectionHandler) HandleGetSectionsForDocument(w http.ResponseWriter, r *http.Request) {
	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	var documentId DocumentId
	err := json.NewDecoder(r.Body).Decode(&documentId)
	if err != nil {
		sh.logger.Printf("ERROR: decodingGetSectionsForDocument: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	sections, err := sh.sectionStore.GetSectionsForDocument(currentUser, documentId.DocumentId)
	if err != nil {
		sh.logger.Printf("ERROR: getSectionsForDocument: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to get all sections"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"sections": sections})
}
