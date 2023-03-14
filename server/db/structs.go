package db

import "database/sql"

type DbConfigFile struct {
	Deps []string
}

type DoDb struct {
	name   string
	dbref  *sql.DB
	config DbConfigFile
}
