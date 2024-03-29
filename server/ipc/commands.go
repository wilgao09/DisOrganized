package ipc

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

type IPCCommand int

// check the db version
type configFileFormat struct {
	Plugins  []string
	Keybinds []string
}

var defaultConfigFile = configFileFormat{
	Plugins:  []string{"Rect", "Poly", "Handwriting"},
	Keybinds: []string{"b", "s", "t"},
}

const (
	CLOSE_SERVER IPCCommand = iota
	// semantically, the client can send either ACCEPT+USER or REJECT_USER and they will both be interpreted as user request entry
	// but for the sake of simplicity, we should noly send ACCEPT_USER with the semantic meaning of "will you accept this user?"
	ACCEPT_USER
	REJECT_USER

	// change directory or get the current directory if payload is empty
	WORKING_DIRECTORY
	// get a list of available boards separated by vertical tabs
	AVAILABLE_BOARDS
	// create a new board, failing if the name is already taken
	CREATE_BOARD
	// open a board with the name X
	OPEN_BOARD
	// close a board with the name X
	CLOSE_BOARD
	// delete a board with the name X
	DELETE_BOARD
	// is the body length is 0, it is a get (either from disk or from admin)
	// if the body legnth is nonzero, it is a set (either admin set or send out to another user)
	CANVAS_URL
	// remove a user by their id
	KICK_USER
)

var currentWorkingDirectory string
var pluginDirectory string

func GetPluginsDirectory() string {

	return pluginDirectory
}

func NewConnectionRequest(name string, ip string) bool {
	log.Println("Making request for entry")
	rescmd, _ := ipcSendAndWait(ACCEPT_USER, fmt.Sprintf("%s@%s", name, ip))
	log.Printf("got response %d\n", rescmd)
	if rescmd == ACCEPT_USER {
		return true
	} else {
		return false
	}
}

func GetWorkingDirectory() string {
	return currentWorkingDirectory
}

// sets the cwd . Returns a bol denoting whether or not is succeeded
func SetCurrentWorkingDirectory(p string) bool {
	fmt.Printf("trying to write out %s\n", p)
	np, err := filepath.Abs(p)
	if err != nil {
		return false
	}
	fmt.Printf("trying to write out %s\n", np)
	if os.MkdirAll(np, os.ModePerm) != nil {
		fmt.Printf("Failed\n")
		fmt.Print(err)
		return false
	}
	currentWorkingDirectory = np
	fmt.Printf(("succeeded\n"))
	return true
}

func SetCurrentPluginDirectory(p string) bool {
	fmt.Printf("trying to write out %s\n", p)
	np, err := filepath.Abs(p)
	if err != nil {
		return false
	}
	fmt.Printf("trying to write out %s\n", np)
	if os.MkdirAll(np, os.ModePerm) != nil {
		fmt.Printf("Failed\n")
		fmt.Print(err)
		return false
	}
	pluginDirectory = np
	fmt.Printf(("succeeded\n"))
	return true
}

// a board is a available in the cwd iff
//
//	there is a directory for it of hte same name
//	within that directory, there is a properly formatted config.json
//
// TODO: think of a way to make getting al available boards cheaper
func GetAvailableBoards() []string {
	entries, err := os.ReadDir(currentWorkingDirectory)
	if err != nil {
		return []string{}
	}
	ans := []string{}
	for _, f := range entries {
		if f.IsDir() {
			file, err := os.OpenFile(fmt.Sprintf("%s/%s/config.json", currentWorkingDirectory, f.Name()), os.O_RDONLY, 0644)
			if err != nil {
				continue //no config
			}
			defer file.Close()

			// fileData, err := io.ReadAll(file)
			// if err != nil {
			// 	continue // mysterious failure
			// }

			// var pluginstruct configFileFormat

			// err = json.Unmarshal(fileData, &pluginstruct)
			// if err != nil {
			// 	continue //not valid config
			// }
			ans = append(ans, f.Name())
		}
	}
	return ans
}

func CreateBoard(name string) bool {

	// does the name exist already?
	file, err := os.OpenFile(fmt.Sprintf("%s/%s/config.json", currentWorkingDirectory, name), os.O_RDONLY, 0644)
	if err == nil { //if hte config file exists, we wont even check if it's valid; maybe the admin is manually creating the config
		file.Close()
		return false
	}

	// make the directory if it doesnt exist yet
	if err = os.Mkdir(fmt.Sprintf("%s/%s/", currentWorkingDirectory, name), os.ModePerm); err != nil {
		if !os.IsExist(err) {
			return false // some error other than the directory existing
		}
	}

	// write config.json
	file, err = os.OpenFile(fmt.Sprintf("%s/%s/config.json", currentWorkingDirectory, name), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return false
	}
	defer file.Close()
	defaultfiledata, err := json.Marshal(defaultConfigFile)
	if err != nil {
		return false
	}
	n, err := file.Write(defaultfiledata)
	if n != len(defaultfiledata) || err != nil {
		return false //something strange happened
	}

	//write canvas.txt (metadata\vbase64encodedURI)
	cfile, err := os.OpenFile(fmt.Sprintf("%s/%s/canvas.png", currentWorkingDirectory, name), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return false
	}
	defer cfile.Close()
	var canvastxt = "0\v0\v0\v0\v"
	n, err = cfile.Write([]byte(canvastxt))
	if n != len(canvastxt) || err != nil {
		return false //something strange happened
	}
	return true
}

func DeleteBoard(name string) bool {
	err := os.RemoveAll(fmt.Sprintf("%s/%s", currentWorkingDirectory, name))
	return err == nil
}

// OpenBoard is in db
// func OpenBoard()

func GetCanvas() string {
	_, url := ipcSendAndWait(CANVAS_URL, "")
	return url
}
