package main

import (
	"fmt"

	"github.com/gin-gonic/gin"

	_ "github.com/mattn/go-sqlite3"
)

func checkError(err error, phase string) {
	if err != nil {
		fmt.Println("failed at ", phase, " for the following reason")
		fmt.Println(err)
		return
	}
	fmt.Println("passed phase ", phase)

}

func main() {
	fmt.Println("hello world from go")
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

	fmt.Println("starting server")
	server := gin.Default()
	server.GET("/helloworld", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"message": "HELLO WORLD",
		})
	})
	fmt.Println("server running on 8888")
	server.Run(":8888")
	fmt.Println("server died!")
}
