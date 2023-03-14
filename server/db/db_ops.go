package db

import "log"

func (dodb *DoDb) AddObject(obj string) bool {
	stmt, err := dodb.dbref.Prepare("insert into board(jsonobj) values ( ? );")
	if err != nil {
		log.Println("failed to prepare stmt")
		return false
	}
	_, err = stmt.Exec(obj)
	if err != nil {
		log.Println("failed to exec prepared stmt")
	}

	return err == nil
}

func (dodb *DoDb) GetObjects() ([]string, error) {
	res, err := dodb.dbref.Query("select jsonobj from board;")
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
