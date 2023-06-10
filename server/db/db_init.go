package db

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var dbdir = "./"
var name = "untitled"
var inited = false

// given a path ot a directory that contains all board data, initialize the db portion of it
// (this assumes that the config portion has already been built)
// dbdirpath should be an absolute pathname
func Init(dbdirpath string) error {

	// check that this is a valid path with a config.json
	f, err := (os.Stat(dbdirpath))
	if err != nil || !f.IsDir() {
		return err
	}
	f, err = os.Stat(fmt.Sprintf("%s/config.json", dbdirpath))
	if err != nil {
		return err
	}
	if f.IsDir() {
		return errors.New("config file is a directory, expected JSON")
	}

	dbdir = dbdirpath
	name = filepath.Base(dbdirpath)
	inited = true

	// check if there is a db file, create one if there isnt
	if !Db_file_exists() {
		if !Create_db_file() {
			inited = false
			return errors.New("failed to create db file")
		}
	}
	return nil
}

func Init_struct() (DoDb, error) {

	var dbstruct DoDb
	// i dont know if this is necessary
	var somelock sync.Mutex
	if !inited {
		return dbstruct, errors.New("database module uninitialized")
	}
	if !Db_file_exists() {
		return dbstruct, errors.New("database does not exist")
	}

	odb, err := sql.Open("sqlite3", fmt.Sprintf("%s/%s.db", dbdir, name))

	if err != nil {
		return dbstruct, errors.New("failed to open db")
	}

	dbstruct.name = name
	dbstruct.dbref = odb
	dbstruct.lock = &somelock

	conf, err := os.Open(dbdir + "/config.json")
	if err != nil {
		return dbstruct, errors.New("failed to open config file")
	}
	defer conf.Close()

	confbytes, err := io.ReadAll(conf)
	if err != nil {
		return dbstruct, errors.New("failed to read config file at " + name)
	}

	err = json.Unmarshal(confbytes, &dbstruct.config)
	dbstruct.config.Init()
	if err != nil {
		return dbstruct, errors.New("failed to parse config file as json")
	}

	return dbstruct, nil
}

func Db_file_exists() bool {
	if !inited {
		return false
	}
	if _, err := os.Stat(fmt.Sprintf("%s/%s.db", dbdir, name)); errors.Is(err, os.ErrNotExist) {
		return false
	}
	return true
}

func Create_db_file() bool {
	if !inited {
		return false
	}
	if Db_file_exists() {
		return false
	}

	odb, err := sql.Open("sqlite3", fmt.Sprintf("%s/%s.db", dbdir, name))

	if err != nil {
		return false
	}
	stmt := `create table board (id integer not null primary key autoincrement, jsonobj text not null);`

	odb.Exec(stmt)
	defer odb.Close()

	return true
}
