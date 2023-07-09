package db

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
)

func (dodb *DoDb) AddObject(obj string) (string, bool) {
	dodb.lock.Lock()
	defer dodb.lock.Unlock()

	// get an id for this object
	idstmt, err := dodb.dbref.Query("select id from board order by id desc limit 1")
	if err != nil {
		log.Println("failed to get next id")
		return "", false
	}
	var id int = 0
	if idstmt.Next() {
		idstmt.Scan(&id)
		id = id + 1
	}
	idstmt.Close()
	obj = fmt.Sprintf("%s,\"id\":%d}", obj[:len(obj)-1], id)

	stmt, err := dodb.dbref.Prepare("insert into board(id, jsonobj) values ( ? , ? );")
	if err != nil {
		log.Println("failed to prepare stmt")
		return "", false
	}
	_, err = stmt.Exec(id, obj)
	if err != nil {
		log.Println("failed to exec prepared stmt")
		log.Printf("%s\n", err)
	}
	stmt.Close()

	return obj, err == nil
}

func (dodb *DoDb) GetObjects() ([]string, error) {
	dodb.lock.Lock()
	defer dodb.lock.Unlock()
	res, err := dodb.dbref.Query("select jsonobj from board order by id asc;")
	if err != nil {
		return []string{}, err
	}
	var ret []string
	ret = make([]string, 0)
	var t string
	for res.Next() {
		res.Scan(&t)
		ret = append(ret, t)
	}
	return ret, nil
}

func (dodb *DoDb) ApplyDiff(diff DbDiff) error {
	dodb.lock.Lock()
	defer dodb.lock.Unlock()
	var err error
	var stmt *sql.Stmt
	switch diff.Dtype {
	//TODO: merge addobj with this
	case DT_ADD:
		stmt, err = dodb.dbref.Prepare("INSERT INTO board(jsonobj) VALUES (?);")
		defer stmt.Close()
		if err != nil {
			return err
		}
		_, err = stmt.Exec(diff.Content)
		if err != nil {
			return err
		}
		return nil
	case DT_REMOVE:
		stmt, err = dodb.dbref.Prepare("DELETE FROM board WHERE id = ? ;")
		defer stmt.Close()
		if err != nil {
			return err
		}
		_, err = stmt.Exec(diff.Id)
		if err != nil {
			return err
		}
		return nil
	case DT_UPDATE:
		stmt, err = dodb.dbref.Prepare("UPDATE board SET jsonobj = ? WHERE id = ?;")
		defer stmt.Close()
		if err != nil {
			return err
		}
		_, err = stmt.Exec(diff.Content, diff.Id)
		if err != nil {
			return err
		}
		return nil
	default:
		return errors.New("Invalid DiffType " + diff.Dtype.String())
	}
}

func (dodb *DoDb) GetConfig() *DbConfigFile {
	return dodb.config
}

func (dodb *DoDb) SetCanvas(c string) {
	os.WriteFile(fmt.Sprintf("%s/canvas.txt", dbdir),
		[]byte(c), 0644)
}

func (dodb *DoDb) GetCanvas() string {
	c, err := os.ReadFile(fmt.Sprintf("%s/canvas.txt", dbdir))
	if err != nil {
		return "0\v0\v0\v0\v"
	}
	return string(c)
}
