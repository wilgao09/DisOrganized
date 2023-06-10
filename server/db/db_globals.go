package db

// TODO: make this capable of storing multiple files

var openBoard DoDb
var hasOpenBoard bool = false

func SetCurrentOpenBoard(b DoDb) {
	openBoard = b
	hasOpenBoard = true
}

func GetCurrentOpenBoard() *DoDb {
	if !hasOpenBoard {
		return nil
	}
	return &openBoard
}

func CloseBoard() {
	hasOpenBoard = false
}

func HasOpenBoard() bool { return hasOpenBoard }
