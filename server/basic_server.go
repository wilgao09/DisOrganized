package main

import (
	"fmt"
	"log"

	dbutil "williamgao09/disorganized/db"
)

// "github.com/gin-gonic/gin"

// func checkError(err error, phase string) {
// 	if err != nil {
// 		fmt.Println("failed at ", phase, " for the following reason")
// 		fmt.Println(err)
// 		return
// 	}
// 	fmt.Println("passed phase ", phase)

// }

func main() {
	fmt.Println("hello world from go")

	// db, err := dbutil.Initialize_db_struct("foo")
	dbutil.Init("./somedir")
	fmt.Println("initted")
	err := dbutil.Create_db_file("kiki")
	if !err {
		log.Fatal(err)
	} else {
		fmt.Println("found")
	}
	// var err error

	// db, err := sql.Open("sqlite3", "./foo.db")
	// checkError(err, "Connect to Database")

	// _, err = db.Exec(`INSERT INTO elements(json) VALUES ('{"this is" : "test data":}');`)
	// checkError(err, "Insert into table")

	// var myid int
	// var myjson string

	// rows, err := db.Query("SELECT * FROM elements WHERE json_extract(json, '$.seven');")
	// checkError(err, "Query table")
	// for rows.Next() {
	// 	rows.Scan(&myid, &myjson)
	// 	fmt.Println(myid, " ", myjson)
	// }

	// fmt.Println("starting server")
	// server := gin.Default()
	// server.GET("/helloworld", func(ctx *gin.Context) {
	// 	ctx.JSON(200, gin.H{
	// 		"message": "HELLO WORLD",
	// 	})
	// })
	// fmt.Println("server running on 8888")
	// server.Run(":8888")
	// fmt.Println("server died!")
}
