package ipc

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
	db "williamgao09/disorganized/db"
)

var IPCStatus = struct {
	lock         sync.Mutex
	hasValue     sync.Mutex
	doneReading  sync.Mutex
	dataReceived string
}{}

/**
*	Main entry point into the IPC handler
*	Expected to be called in a goroutine
*	Does not return
 */
func IpcListen() {
	reader := bufio.NewReader(os.Stdin)
	IPCStatus.hasValue.Lock()
	for {
		s, e := reader.ReadString('\n')
		if e != nil {
			log.Fatalf("Bad input: %s", e)
			continue
		}
		s = s[:len(s)-1]
		log.Printf("New raw: <%s> len %d\n", s, len(s))
		cmd, bod := parseIPCComand(s)
		// a command is eit
		switch cmd {
		case CLOSE_SERVER:
			log.Printf("got close server request\n")
			// do something
			goto next //this is just a continue
		case ACCEPT_USER:
			log.Printf("got accept user response: %s\n", s)
			// note that this gets passed to teh IPCStatus
			// struct to get handled in a client thread
		case REJECT_USER:
			log.Printf("got reject user response: %s\n", s)
			// note that this gets passed to teh IPCStatus
			// struct to get handled in a client thread
		case WORKING_DIRECTORY:
			log.Printf("got working directory request: %s\n", s)
			if len(bod) > 0 {

				if SetCurrentWorkingDirectory(bod) {
					ipcSend(WORKING_DIRECTORY, "1")
				} else {
					ipcSend(WORKING_DIRECTORY, "0")
				}
			} else {
				ipcSend(WORKING_DIRECTORY, GetWorkingDirectory())
			}
			goto next
		case AVAILABLE_BOARDS:
			ipcSend(AVAILABLE_BOARDS, strings.Join(GetAvailableBoards(), "\v"))
			goto next
		case CREATE_BOARD:
			delim := regexp.MustCompile(`\v`)
			bod = delim.ReplaceAllString(bod, "") // zero out the \v
			if CreateBoard(bod) {
				ipcSend(CREATE_BOARD, "1")
			} else {
				ipcSend(CREATE_BOARD, "0")
			}
			goto next
		case OPEN_BOARD:
			bpath := fmt.Sprintf("%s/%s", GetWorkingDirectory(), bod)
			err := db.Init(bpath)
			if err != nil {
				log.Printf("Failed to find board at %s", bpath)
				ipcSend(OPEN_BOARD, "Failed to find board")
			}
			log.Printf("Found board at %s\n", bpath)
			dodb, err := db.Init_struct()
			if err != nil {
				log.Printf("Found board, but failed to open\n")
				log.Printf("%s\n", err)
				ipcSend(OPEN_BOARD, "Failed to open board")
			}
			db.SetCurrentOpenBoard(dodb)
			ipcSend(OPEN_BOARD, "")
			goto next

		case CLOSE_BOARD:
			db.CloseBoard()
		case DELETE_BOARD:
			if DeleteBoard(bod) {
				ipcSend(DELETE_BOARD, "1")
			} else {
				ipcSend(DELETE_BOARD, "0")
			}
		case CANVAS_URL:
			if len(bod) == 0 {
				// admin is asking for the disk copy
				ipcSend(CANVAS_URL,
					db.GetCurrentOpenBoard().GetCanvas())
				goto next
			} else {
				// admin wants to set the current board
				// or someone is asking
				db.GetCurrentOpenBoard().SetCanvas(bod)
				// possible that this call was a result of someone asking
			}

		default:
			log.Printf("Unrecognized command %d", cmd)
		}

		// this is for send and waits
		// if the incoming message expects to be
		// a response to a previous message sent out by the server
		// it will need to bounce through this set of lock
		IPCStatus.dataReceived = s
		IPCStatus.hasValue.Unlock()

		IPCStatus.doneReading.Lock()
		IPCStatus.hasValue.Lock()
		IPCStatus.doneReading.Unlock()
	next:
	}

}

func parseIPCComand(s string) (IPCCommand, string) {
	if len(s) == 0 {
		log.Fatal("Tried to parse a string of length 0 in parseIPCCommand")
	}
	return IPCCommand(s[0] - 32), s[1:]
}

func ipcSendAndWait(c IPCCommand, s string) (IPCCommand, string) { // to be called from a client thread
	// only one client can have control over the IPC functions
	IPCStatus.lock.Lock()

	fmt.Fprintf(os.Stdout, "%c%s\n", rune(c+32), s)

	// writer := bufio.NewWriter(os.Stdout)
	// s = fmt.Sprintf("%c%s\n", rune(c+32), s)
	// cnt, err := writer.WriteString(s)
	// if err != nil || cnt != len(s) {
	// 	log.Fatal("Failed to send command in ipcSend")
	// }

	IPCStatus.doneReading.Lock()
	IPCStatus.hasValue.Lock() // wait for a value to come in

	// value should be ready
	res := IPCStatus.dataReceived
	IPCStatus.doneReading.Unlock()
	IPCStatus.hasValue.Unlock()
	time.Sleep(time.Second / 100) //TODO: remove this and fix the larger concurrency issue
	IPCStatus.lock.Unlock()
	return parseIPCComand(res)
}

func ipcSend(c IPCCommand, s string) {
	IPCStatus.lock.Lock()
	log.Println("ipcsending")
	fmt.Fprintf(os.Stdout, "%c%s\n", rune(c+32), s)
	// writer := bufio.NewWriter(os.Stdout)
	// s = fmt.Sprintf("%c%s\n", rune(c+32), s)
	// cnt, err := writer.WriteString(s)

	// log.Printf("wrote out %d bytes\n", cnt)
	// if err != nil || cnt != len(s) {
	// 	log.Fatal("Failed to send command in ipcSend")
	// }
	IPCStatus.lock.Unlock()
}
