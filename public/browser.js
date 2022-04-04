const createForm = document.querySelector("#create-form");
const itemList = document.querySelector("#item-list");

function itemTemplate(task, id) {
	return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
	<span class="item-text">${task}</span>
	<div>
	<button data-id="${id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
	<button data-id="${id}" class="delete-me btn btn-danger btn-sm">Delete</button>
	</div>
	</li>`;
}

//create feature

createForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const createField = document.querySelector("#create-field");
	const newTask = createField.value;
	if (!newTask) return;
	createField.value = "";
	const newTaskJSON = JSON.stringify({
		task: newTask,
	});
	fetch("/create-item", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: newTaskJSON,
	})
		.then((response) => response.json())
		.then((data) => {
			itemList.insertAdjacentHTML(
				"beforeend",
				itemTemplate(data.task, data._id)
			);
		})
		.catch((err) => console.log(`Error has occurred: ${err}`));
});

//edit feature
const editItem = function (e) {
	const newTask = prompt(
		"Please type in new value:",
		e.target.parentElement.parentElement.querySelector(".item-text").textContent
	);
	if (!newTask) return;
	const updatedTaskJSON = JSON.stringify({
		_id: e.target.dataset.id,
		task: newTask,
	});
	fetch("/update-item", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: updatedTaskJSON,
	})
		.then(() => {
			e.target.parentElement.parentElement.querySelector(
				".item-text"
			).textContent = newTask;
		})
		.catch((err) => console.log(`Error has occurred: ${err}`));
};

//delete feature
const deleteItem = function (e) {
	if (confirm("Do you really want to permanently delete this item?")) {
		const deleteTaskJSON = JSON.stringify({
			_id: e.target.dataset.id,
		});
		fetch("/delete-item", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: deleteTaskJSON,
		})
			.then(() => {
				e.target.parentElement.parentElement.remove();
			})
			.catch((err) => console.log(`Error has occurred: ${err}`));
	}
};

itemList.addEventListener("click", (e) => {
	if (e.target.classList.contains("edit-me")) editItem(e);
	if (e.target.classList.contains("delete-me")) deleteItem(e);
});

//create items list

let ourHtml = items.map((item) => itemTemplate(item.task, item._id)).join("");

itemList.insertAdjacentHTML("beforeend", ourHtml);
