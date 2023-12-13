const tasks = [
    /*     {
            id: 1,
            name: 'Task 1',
            completed: false
        } */
];
let lastTaskId = 0;

let taskList;
let addTask;
let accessToken = localStorage.getItem("token");

// kui leht on brauseris laetud siis lisame esimesed taskid lehele
window.addEventListener('load', () => {
    document.getElementById("loginForm").addEventListener("submit", login);
    document.getElementById("logOutBtn").addEventListener("click", logout);
    if (accessToken != null) {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("logOutBtn").style.display = "block";
        getTasks();
    } else {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("logOutBtn").style.display = "none";
    }
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');

    tasks.forEach(renderTask);

    // kui nuppu vajutatakse siis lisatakse uus task
    addTask.addEventListener('click', () => {
        const task = createTask(); // Teeme kõigepealt lokaalsesse "andmebaasi" uue taski
        const taskRow = createTaskRow(task); // Teeme uue taski HTML elementi mille saaks lehe peale listi lisada
        taskList.appendChild(taskRow); // Lisame taski lehele
    });
});

function login(e) {
    e.preventDefault();
    let loginForm = document.getElementById("loginForm");
    let formData = new FormData(loginForm);
    let uname, psw;
    for (const [name, value] of formData) {
        if (name == 'uname') { uname = value; }
        if (name == 'psw') { psw = value }
    }
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "username": uname,
        "password": psw
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    fetch("https://demo2.z-bit.ee/users/get-token", requestOptions)
        .then(response => response.text())
        .then(function (result) {
            result = JSON.parse(result);
            if (result.status == null) {
                document.getElementById("loginForm").style.display = "none";
                document.getElementById("logOutBtn").style.display = "block";
                accessToken = result.access_token;
                localStorage.setItem("token", accessToken);
                getTasks();
            } else {
                document.getElementById('loginStatus').innerHTML = 'Username or password invalid!';
            }
        })
        .catch(error => console.log('error', error));
}

function logout() {
    localStorage.clear();
    accessToken = '';
    tasks.splice(0, tasks.length + 1);
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("logOutBtn").style.display = "none";
    let taskListItems = document.getElementsByClassName('ant-list-item');
    console.log(taskListItems);
    for (let i = taskListItems.length - 2; i >= 0; i--) {
        taskListItems[i].remove();
    }
}

function getTasks() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + accessToken);

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch("https://demo2.z-bit.ee/tasks", requestOptions)
        .then(response => response.text())
        .then(function (result) {
            result = JSON.parse(result);
            result.forEach((currentTask) => {
                const task = {
                    id: currentTask.id,
                    name: currentTask.title,
                    completed: currentTask.marked_as_done
                };
                tasks.push(task);
            })
            tasks.forEach(renderTask);
        })
        .catch(error => console.log('error', error));
}

function renderTask(task) {
    console.log(task)
    const taskRow = createTaskRow(task);
    taskList.appendChild(taskRow);
    lastTaskId++;
    console.log(document.getElementsByClassName('ant-list-item'));
}



function createTask() {
    console.log('Create task');
    lastTaskId++;
    const task = {
        id: lastTaskId,
        name: 'Task ' + lastTaskId,
        completed: false
    };
    tasks.push(task);

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + accessToken);

    var raw = JSON.stringify({
        "title": task.name
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://demo2.z-bit.ee/tasks", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));

    return task;
}

function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');

    // Täidame vormi väljad andmetega
    const name = taskRow.querySelector("[name='name']");
    name.value = task.name;
    name.addEventListener('input', () => {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + accessToken);

        var raw = JSON.stringify({
            "title": name.value
        });

        var requestOptions = {
            method: 'PUT',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://demo2.z-bit.ee/tasks/" + task.id, requestOptions)
            .then(response => response.text())
            .catch(error => console.log('error', error));
    });

    const checkbox = taskRow.querySelector("[name='completed']");
    checkbox.checked = task.completed;

    const deleteButton = taskRow.querySelector('.delete-task');
    deleteButton.addEventListener('click', () => {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + accessToken);

        var raw = "";

        var requestOptions = {
            method: 'DELETE',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://demo2.z-bit.ee/tasks/" + task.id, requestOptions)
            .then(response => response.text())
            .catch(error => console.log('error', error));
        taskList.removeChild(taskRow);
        tasks.splice(tasks.indexOf(task), 1);
    });

    // Valmistame checkboxi ette vajutamiseks
    hydrateAntCheckboxes(taskRow, task.id);

    return taskRow;
}


function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

/**
 * See funktsioon aitab lisada eridisainiga checkboxile vajalikud event listenerid
 * @param {HTMLElement} element Checkboxi wrapper element või konteiner element mis sisaldab mitut checkboxi
 */
function hydrateAntCheckboxes(element, id) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // Kui element on juba töödeldud siis jäta vahele
        if (wrapper.__hydrated)
            continue;
        wrapper.__hydrated = true;


        const checkbox = wrapper.querySelector('.ant-checkbox');

        // Kontrollime kas checkbox peaks juba olema checked, see on ainult erikujundusega checkboxi jaoks
        const input = wrapper.querySelector('.ant-checkbox-input');
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }

        // Kui checkboxi või label'i peale vajutatakse siis muudetakse checkboxi olekut
        wrapper.addEventListener('click', () => {
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + accessToken);

            if (input.checked == true) {
                var raw = JSON.stringify({
                    "marked_as_done": true
                });
            } else {
                var raw = JSON.stringify({
                    "marked_as_done": false
                });
            }

            var requestOptions = {
                method: 'PUT',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };

            fetch("https://demo2.z-bit.ee/tasks/" + id, requestOptions)
                .then(response => response.text())
                .catch(error => console.log('error', error));
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}