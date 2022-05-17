const TO_DO_TABLE = "todos";

class TodoManagerService {

    constructor(enclaveDB) {
        this.enclave = enclaveDB;
    }

    createToDo(todo, callback) {
        this.enclave.insertRecord(TO_DO_TABLE, todo.input.name, todo, callback);
    }

    removeToDo(todo, callback) {
        this.enclave.deleteRecord(TO_DO_TABLE, todo.input.name, callback);
    }

    editToDo(todo, callback) {
        this.enclave.updateRecord(TO_DO_TABLE, todo.input.name, todo, callback);
    }

    listToDos(callback) {
        this.enclave.getAllRecords(TO_DO_TABLE, callback);
    }

    listLastHourActiveToDos(callback) {
        let oneHourAgo = Date.now() - (60 * 60 * 1000); 
        this.enclave.filter(TO_DO_TABLE, `__timestamp >= ${oneHourAgo}`, callback);
    }

    listSortedToDos(sortType, callback) {
        // sortType = asc | dsc;
        this.enclave.filter(TO_DO_TABLE, undefined, `${sortType}`, callback);
    }

    addFieldIndex(fieldName, callback) {
        this.enclave.addIndex(TO_DO_TABLE, `${fieldName}`, callback);
    }


}

let todoManagerService;
let getTodoManagerServiceInstance = function (controllerInstance, callback) {
    if (!todoManagerService) {
        controllerInstance.getMainEnclaveDB((err, enclave) => {
            if (err) {
                console.log('Could not get main enclave ', err);
                return callback(err);
            }

            // enclave.getAllRecords(TO_DO_TABLE, (err, data) => {
            //     console.log("GOT THE DATA")
            //     console.log(data)
            // })
            
            // let oneHourAgo = Date.now() - (60 * 60 * 1000); 
            // enclave.filter(TO_DO_TABLE, `__timestamp >= ${oneHourAgo}`, (err, data) => {
            //     console.log("TIMP")
            //     console.log(data)
            // })

            

            console.log(enclave)
            todoManagerService = new TodoManagerService(enclave);
            return callback(todoManagerService)
        })

    } else {
        return callback(todoManagerService);
    }
}

export {
    getTodoManagerServiceInstance
};
