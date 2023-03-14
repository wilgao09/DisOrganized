package db

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var dbdir = "./"
var inited = false

func Init(dbdirpath string) error {

	if dbdirpath[len(dbdirpath)-1:] != "/" {
		dbdirpath += "/"
	}
	dbdirpath += "boards/"

create_boards_dir:
	f, err := os.Stat(dbdirpath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			os.Mkdir(dbdirpath, 0666)
			goto create_boards_dir
		} else {
			return errors.New("failed to stat")
		}
	}
	if !f.IsDir() {
		os.Remove(dbdirpath)
		os.Mkdir(dbdirpath, 0666)
	}
	dbdir = dbdirpath
	inited = true
	return nil
}

func Init_struct(name string) (DoDb, error) {

	var dbstruct DoDb
	if !inited {
		return dbstruct, errors.New("database module uninitialized")
	}
	name = dbdir + name
	if _, err := os.Stat(name + ".db"); errors.Is(err, os.ErrNotExist) {
		return dbstruct, errors.New("database does not exist")
	}

	odb, err := sql.Open("sqlite3", name+".db")

	if err != nil {
		return dbstruct, errors.New("failed to open db")
	}

	dbstruct.name = name
	dbstruct.dbref = odb

	conf, err := os.Open(name + ".json")
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

func Db_file_exists(name string) bool {
	if !inited {
		return false
	}
	name = dbdir + name
	if _, err := os.Stat(name + ".db"); errors.Is(err, os.ErrNotExist) {
		return false
	}
	return true
}

const initjson = `{
	"deps": []
}`

func create_json_file(name string) bool {
	var n int
	f, err := os.Create(name + ".json")
	if err != nil {
		return false
	}
	n, err = f.Write([]byte(initjson))
	if err != nil || n != len(initjson) {
		return false
	}
	return true
}

func Create_db_file(name string) bool {
	if !inited {
		return false
	}
	if Db_file_exists(name) {
		return false
	}
	name = dbdir + name

	odb, err := sql.Open("sqlite3", "./"+name+".db")

	if err != nil {
		return false
	}
	stmt := `create table board (id integer not null primary key autoincrement, jsonobj text not null);`

	odb.Exec(stmt)
	defer odb.Close()

	return create_json_file(name)
}
