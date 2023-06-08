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

	// do some prepwork here
	// make sure the directory exists
	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("cannot read user home")
	}
	SetCurrentWorkingDirectory(home + "/DisOrganized/boards")

	reader := bufio.NewReader(os.Stdin)
	IPCStatus.hasValue.Lock()
	for {
		s, e := reader.ReadString('\n')
		if e != nil {
			log.Fatalf("Bad input: %s", e)
			continue
		}
		log.Printf("New raw: <%s> len %d\n", s, len(s))
		cmd, bod := parseIPCComand(s)
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
		default:
			log.Printf("Unrecognized command %d", cmd)
		}

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
	time.Sleep(time.Second / 10) //TODO: remove this and fix the larger concurrency issue
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
