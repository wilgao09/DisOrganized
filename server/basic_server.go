package main

import (
	"fmt"
	"log"

	dbutil "williamgao09/disorganized/db"

	"github.com/gin-gonic/gin"
)

const portno = 11326

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

	err := dbutil.Init("../../..")
	if err != nil {
		log.Fatal("Failed to initialize the boards directory")
	}

	// err := dbutil.Create_db_file("kiki")
	// if !err {
	// 	log.Fatal(err)
	// } else {
	// 	fmt.Println("found")
	// }
	// db, e := dbutil.Init_struct("kiki")
	// if e != nil {
	// 	log.Fatal(e)
	// } else {
	// 	fmt.Println("db struct initted")
	// }
	// b := db.AddObject("{\"x\": 100, \"y\":100, \"w\":100, \"h\": 100}")
	// if !b {
	// 	fmt.Println("failed to add object")
	// }

	// db.ApplyDiff(dbutil.DbDiff{
	// 	Dtype:   dbutil.DT_UPDATE,
	// 	Id:      2,
	// 	Content: "{\"x\": 5000, \"y\": 6000}",
	// })

	// fmt.Println(db.GetObjects())

	fmt.Println("starting server")
	server := gin.Default()
	server.GET("/helloworld", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"message": "HELLO WORLD",
		})
	})

	server.GET("/api/retrieveFile")
	server.GET("/api/retrieveConfig")

	server.POST("/api/addDep")
	server.POST("/api/createFile/:")
	server.POST("/api/openFile/:")
	server.POST("/api/closeFile/")
	server.POST("/api/diff/:name")


	fmt.Printf("server running on %d\n", portno)
	server.Run(fmt.Sprintf(":%d", portno))
	fmt.Println("server died!")
}
