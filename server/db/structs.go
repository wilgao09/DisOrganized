package db

import (
	"database/sql"
	"fmt"
	"sync"
)

// check the ws version
type DbConfigFile struct {
	Plugins  []string
	Keybinds []string
}

type DoDb struct {
	name   string
	dbref  *sql.DB
	config *DbConfigFile
	lock   *sync.Mutex
}

type DiffType uint

const (
	DT_ADD DiffType = iota
	DT_REMOVE
	DT_UPDATE
)

func (d DiffType) String() string {
	switch d {
	case DT_ADD:
		return "DT_ADD"
	case DT_REMOVE:
		return "DT_REMOVE"
	case DT_UPDATE:
		return "DT_UPDATE"
	default:
		return fmt.Sprintf("DT_%d", d)
	}

}

type DbDiff struct {
	Dtype   DiffType
	Id      int
	Content string
}
