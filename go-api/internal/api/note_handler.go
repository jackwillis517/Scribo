package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackwillis517/Scribo/internal/middleware"
	"github.com/jackwillis517/Scribo/internal/store"
	"github.com/jackwillis517/Scribo/internal/utils"
)

type NoteHandler struct {
	noteStore store.NoteStore
	logger    *log.Logger
}

type NoteId struct {
	NoteId string `json:"id"`
}

func NewNoteHandler(noteStore store.NoteStore, logger *log.Logger) *NoteHandler {
	return &NoteHandler{
		noteStore: noteStore,
		logger:    logger,
	}
}

func (nh *NoteHandler) HandleCreateNote(w http.ResponseWriter, r *http.Request) {
	var note store.Note
	err := json.NewDecoder(r.Body).Decode(&note)
	if err != nil {
		nh.logger.Printf("ERROR: decodingCreateNote: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	createdNote, err := nh.noteStore.CreateNote(&note)
	if err != nil {
		nh.logger.Printf("ERROR: createNote: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to create note"})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, utils.Envelope{"note": createdNote})
}

func (nh *NoteHandler) HandleReadNote(w http.ResponseWriter, r *http.Request) {
	var noteId NoteId
	err := json.NewDecoder(r.Body).Decode(&noteId)
	if err != nil {
		nh.logger.Printf("ERROR: decodingReadNote: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	note, err := nh.noteStore.ReadNote(noteId.NoteId)
	if err != nil {
		nh.logger.Printf("ERROR: readNote: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to read note"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"note": note})
}

func (nh *NoteHandler) HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
	var note store.Note
	err := json.NewDecoder(r.Body).Decode(&note)
	if err != nil {
		nh.logger.Printf("ERROR: decodingUpdateNote: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	updatedNote, err := nh.noteStore.UpdateNote(&note)
	if err != nil {
		nh.logger.Printf("ERROR: updateNote: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to update note"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"note": updatedNote})
}

func (nh *NoteHandler) HandleDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteID, err := utils.ReadStringParam(r)

	if err != nil {
		nh.logger.Printf("ERROR: readStringParam: %v", err)
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "internal request error"})
		return
	}

	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	err = nh.noteStore.DeleteNote(noteID)
	if err != nil {
		nh.logger.Printf("ERROR: deleteNote: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to delete note"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"result": "note deleted"})
}

func (nh *NoteHandler) HandleGetAllNotes(w http.ResponseWriter, r *http.Request) {
	currentUser := middleware.GetUser(r)
	if currentUser == nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.Envelope{"error": "you must be logged in"})
		return
	}

	notes, err := nh.noteStore.GetAllNotes(currentUser)
	if err != nil {
		nh.logger.Printf("ERROR: getAllNotes: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.Envelope{"error": "failed to get all notes"})
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.Envelope{"notes": notes})
}
