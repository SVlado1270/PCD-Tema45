import {getTodoManagerServiceInstance} from "../services/TodoManagerService.js";

const {WebcController} = WebCardinal.controllers;

export default class TodoListController extends WebcController {
    constructor(...props) {
        super(...props);
        getTodoManagerServiceInstance(this, (todoService) => {
            this.TodoManagerService = todoService;
            // Populate existing todos to item list
            this.populateItemList((err, data) => {
                if (err) {
                    return this._handleError(err);
                } else {
                    this.setItemsClean(data);
                }
                // Init the listeners to handle events
                setTimeout(this.initListeners, 100);
            });
        });

        // Set some default values for the view model
        this.model = {
            items: [],
            item: {
                id: 'item',
                name: 'item',
                value: '',
                placeholder: 'Type your item here'
            },
            'no-data': 'There are no TODOs'
        };

    }

    initListeners = () => {
        // Select the creating field and add
        // focusout event listener
        // This is used for creating new todo elements
        const todoCreatorElement = this.getElementByTag('create-todo');
        if (todoCreatorElement) {
            todoCreatorElement.addEventListener("focusout", this._mainInputBlurHandler);
        }

        const filterDeletedToDos = this.getElementByTag('deleted-todos');
        if (filterDeletedToDos) {
            filterDeletedToDos.addEventListener("click", this.listDeletedToDos);
        }

        const filter1HActiveToDos = this.getElementByTag('active-todos-1h');
        if (filter1HActiveToDos) {
            filter1HActiveToDos.addEventListener("click", this.list1HActiveToDos);
        }

        const filterActiveToDos = this.getElementByTag('all-todos');
        if (filterActiveToDos) {
            filterActiveToDos.addEventListener("click", this.listActiveToDos);
        }

        const sortByDateDescElement = this.getElementByTag('sort-date-desc');
        if (sortByDateDescElement) {
            sortByDateDescElement.addEventListener("click", this.listSortedToDosByDateDesc);
        }

        const sortByDateAscElement = this.getElementByTag('sort-date-asc');
        if (sortByDateAscElement) {
            sortByDateAscElement.addEventListener("click", this.listSortedToDosByDateAsc);
        }

        const addTSTMPIndexElement = this.getElementByTag('add-index-tstmp');
        if (addTSTMPIndexElement) {
            addTSTMPIndexElement.addEventListener("click", this.addTSTMPFieldIndex);
        }

        // Selecting the parent of all the items and add the event listeners
        const itemsElement = this.getElementByTag('items');
        if (itemsElement) {
            itemsElement.addEventListener("focusout", this._blurHandler)
            itemsElement.addEventListener("click", this._changeToDoCheckedState)
            itemsElement.addEventListener("dblclick", this._doubleClickHandler)
            itemsElement.addEventListener('contextmenu', this._removeToDo, false);
        }

    }

    populateItemList(callback) {
        this.TodoManagerService.listToDos(callback);
    }

    get1HActiveToDos(callback) {
        this.TodoManagerService.listLastHourActiveToDos(callback);
    }

    getSortedToDos(sortType, callback) {
        this.TodoManagerService.listSortedToDos(sortType, callback);
    }

    _addNewListItem() {
        // Get the identifier as the index of the new element
        let fieldIdentifier = this.model.items.length + 1;

        let newItem = {
            checkbox: {
                name: 'todo-checkbox-' + fieldIdentifier,
                checked: false
            },
            input: {
                name: 'todo-input-' + fieldIdentifier,
                value: this.model.item.value,
                readOnly: true
            }
        };

        this.TodoManagerService.createToDo(newItem, (err, data) => {
            if (err) {
                return this._handleError(err);
            }

            // Bring the path and the seed to the newItem object
            newItem = {
                ...newItem,
                ...data
            };

            // Appended to the "items" array
            this.model.items.push(newItem);

            // Clear the "item" view model
            this.model.item.value = '';
        });
    }

    stringIsBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

    _mainInputBlurHandler = (event) => {
        // We shouldn't add a blank element in the list
        if (!this.stringIsBlank(event.target.value)) {
            this._addNewListItem();
        }
    }

    _blurHandler = (event) => {
        // Change the readOnly property to true and save the changes of the field
        let currentToDo = this.changeReadOnlyPropertyFromEventItem(event, true);
        this.editListItem(currentToDo);
    }

    _doubleClickHandler = (event) => {
        // Change the readOnly property in false so we can edit the field
        this.changeReadOnlyPropertyFromEventItem(event, false);
    }

    changeReadOnlyPropertyFromEventItem = (event, readOnly) => {
        let elementName = event.target.name;
        // If the element that triggered the event was not a todo-input we ignore it
        if (!elementName || !elementName.includes('todo-input')) {
            return;
        }

        // Find the wanted element and change the value of the read-only property
        let items = this.model.items
        let itemIndex = items.findIndex((todo) => todo.input.name === elementName)
        items[itemIndex].input = {
            ...items[itemIndex].input,
            readOnly: readOnly
        }
        this.setItemsClean(items);
        return items[itemIndex];
    }

    _changeToDoCheckedState = (event) => {
        let elementName = event.target.name;
        // If the element that triggered the event was not a todo-checkbox we ignore it
        if (!elementName || !elementName.includes('todo-checkbox')) {
            return;
        }

        // Find the wanted element and change the value of the checked property
        let items = this.model.items
        let itemIndex = items.findIndex((todo) => todo.checkbox.name === event.target.name)
        items[itemIndex].checkbox = {
            ...items[itemIndex].checkbox,
            checked: !items[itemIndex].checkbox.checked,
        }
        this.setItemsClean(items);
        this.editListItem(items[itemIndex]);
    }

    _removeToDo = (event) => {
        event.preventDefault();
        let elementName = event.target.name;
        // If the element that triggered the event was not a todo-checkbox we ignore it
        if (!elementName || !elementName.includes('todo-checkbox')) {
            return;
        }

        // Find the wanted element and change the value of the checked property
        let items = this.model.items
        let itemIndex = items.findIndex((todo) => todo.checkbox.name === event.target.name)
        let ToDoPath = items[itemIndex]

        console.log(items)
        console.log(ToDoPath)
        this.TodoManagerService.removeToDo(ToDoPath, (err, data) => {
            if (err) {
                return this._handleError(err);
            }
            console.log(data)
        });

        items.splice(itemIndex, 1);
        this.setItemsClean(items);

    }

    todoIsValid(todo) {
        // Check if the todo element is valid or not
        return !(!todo || !todo.input || !todo.checkbox);
    }

    editListItem(todo) {
        if (!this.todoIsValid(todo)) {
            return;
        }
        this.TodoManagerService.editToDo(todo, (err, data) => {
            if (err) {
                return this._handleError(err);
            }
        })
    }

    setItemsClean = (newItems) => {
        if (newItems) {
            // Set the model fresh, without proxies
            this.model.items = JSON.parse(JSON.stringify(newItems))
        } else {
            this.model.items = [];
        }
    }

    setDeletedItemsClean = (newItems) => {
        if (newItems) {
            // Set the model fresh, without proxies
            this.model.items = JSON.parse(JSON.stringify(newItems)).filter(todo => todo.__deleted == true)

        } else {
            this.model.items = [];
        }
    }

    listSortedToDosByDateDesc = () => {
        this.getSortedToDos("dsc", (err, data) => {
            if (err) {
                return this._handleError(err);
            } else {
                this.setItemsClean(data);
            }
        });
    }

    listSortedToDosByDateAsc = () => {
        this.getSortedToDos("asc", (err, data) => {
            if (err) {
                return this._handleError(err);
            } else {
                this.setItemsClean(data);
            }
        });
    }

    listDeletedToDos = () => {
        this.populateItemList((err, data) => {
            if (err) {
                return this._handleError(err);
            } else {
                this.setDeletedItemsClean(data);
            }
        });
    }

    list1HActiveToDos = () => {
        this.get1HActiveToDos((err, data) => {
            if (err) {
                return this._handleError(err);
            } else {
                this.setItemsClean(data);
            }
        });
    }

    listActiveToDos = () => {
        this.populateItemList((err, data) => {
            if (err) {
                return this._handleError(err);
            } else {
                this.setItemsClean(data);
            }
        });
    }

    addTSTMPFieldIndex = () => {
        this.TodoManagerService.addFieldIndex("__timestamp", (err) => {
            if (err)
                return this._handleError(err);
        })
    }

    _handleError = (err) => {
        const message = "Caught this:" + err.message + ". Do you want to try again?"
        this.showErrorModal(
            message, // An error or a string, it's your choice
            'Oh no, an error..',
            () => {
                console.log("Let's try a refresh");
                window.location.reload();
            },
            () => {
                console.log('You choose not to refresh! Good luck...');
            },
            {
                disableExpanding: true,
                cancelButtonText: 'No',
                confirmButtonText: 'Yes',
                id: 'error-modal'
            }
        );
    }
}