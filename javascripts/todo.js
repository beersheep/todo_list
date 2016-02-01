var App = {
  $main: $("main"),
  $sidebar: $("sidebar"),
  $add_todo: $("#add_todo"),
  todo_list: [],
  todo_count: 0,
  countTodo: function() {
    var self = this,
        undone_item = this.Todos.models.filter(function(model){
          return !model.complete;
        });

    self.todo_count = undone_item.length;
    this.renderTodoCount();
  },
  renderTodoCount: function() {
    var self = this;
    $(".all_todos").html(templates.all_todo_count(App))
  },
  renderAddForm: function(e) {
    e.preventDefault();

    this.$add_todo.html(templates.add_todo_form);
    this.$add_todo.off("click");
  },
  removeAddTodoForm: function() {
    this.$add_todo.html(templates.remove_todo_form);
    this.$add_todo.on("click", this.renderAddForm.bind(this));
  },
  removeItem: function(e) {
    e.preventDefault();
    var $this = $(e.target),
        $li = $this.closest("li"),
        idx = +$this.closest("li").attr("id"),
        model = App.Todos.get(idx);

    App.Todos.remove(model);
    App.storeLocally();
  },
  getTodoName: function(e) {
    e.preventDefault(); 
    var name = $(e.target).find("#todo_name").val(),
        model, 
        view;

    if (!name) { return; }
    this.addTodoItem(name);
  },
  addTodoItem: function(name) {
    model = this.Todos.add({
      name: name, 
      complete: false, 
    });

    view = new this.TodoView(model);
    view.$el.appendTo("#todo_items");

    this.removeAddTodoForm();
    this.storeLocally();
  },
  storeLocally: function() {
    var self = this;

    self.todo_list = [];

    self.Todos.models.forEach(function(model) {
      self.todo_list.push(model.attributes.name);
    });

    localStorage.setItem("todo_items", this.todo_list);
  },
  renderStoredItem: function() {
    var self = this;

    if (!localStorage.getItem("todo_items")) { return; }

    var names = localStorage.getItem("todo_items").split(",");

    names.forEach(function(name) {
      self.addTodoItem(name);
    });
  },
  showModal: function(e) {
    e.preventDefault();

    var $this = $(e.target),
        $li = $this.closest("li"), 
        $modal = $li.find(".modal"),
        $modals = $li.find(".modal, .modal_layer"),
        idx = +$li.attr("id"),
        model = App.Todos.get(idx);

    $modal.css({
      top: $(window).scrollTop() + 100
    });

    $modals.fadeIn(300);

    $modal.find(".complete").on("click", App.completeTask.bind(App));
    $modal.find("form").on("submit", App.updateModel.bind(App));
  },
  updateModel: function(e) {
    e.preventDefault();
    var $form = $(".modal").find("form:visible"),
        $li = $form.closest("li"), 
        data = $form.serializeArray(),
        idx = +$li.attr("id"),
        model = this.Todos.get(idx),
        temp = {};

    data.forEach(function(obj){
      temp[obj.name] = obj.value;
    });

    if (temp.due_day && temp.due_year && temp.due_day) {
      temp.date = new Date(temp.due_year, (temp.due_month - 1), temp.due_day);
      for (prop in temp) {
        if (prop.startsWith("due")) {
          delete temp[prop];
        }
      }
    }

    for (prop in temp) {
      model.set(prop, temp[prop]);
    }

    App.closeModal();
  },
  completeTask: function(e) {
    e.preventDefault();

    this.markDone(e);
    this.closeModal();
  },
  closeModal: function() {
    $(".modal, .modal_layer").fadeOut(300);
  },
  markDone: function(e) {
    e.preventDefault();
    var $this = $(e.target),
        $li = $this.closest("li"),
        idx = +$this.closest("li").attr("id"),
        model = App.Todos.get(idx);

    model.complete = !model.complete; 

    App.countTodo();
    $li.toggleClass("finished");

  },
  markAllComplete: function(e) {
    e.preventDefault();

    this.Todos.models.forEach(function(model){
      model.set("complete", true);
    });

    $(".todo").closest("li").addClass("finished");
  },
  removeAll: function(e) {
    e.preventDefault();

    var self = this;
    self.Todos.models.forEach(function(model) {
      self.Todos.remove(model);
    });
    self.storeLocally();
  },
  bindEvent: function() {
    this.$add_todo.on("click", this.renderAddForm.bind(this));
    this.$main.on("submit", "#add_item", this.getTodoName.bind(this));
    this.$main.on("click", "#mark_all_complete", this.markAllComplete.bind(this));
    this.$main.on("click", "#remove_all", this.removeAll.bind(this));
  },
  init: function() {
    this.bindEvent();
    this.renderTodoCount();
    this.renderStoredItem();
  }
};


App.Todo = new ModelConstructor({
  change: function() {
    App.storeLocally();
  }
});

App.TodosConstructor = new CollectionConstructor();

App.Todos = new App.TodosConstructor(App.Todo);


App.countTodo = {
  todo_count:0
}

App.countTodo = new ModelConstructor();

var templates = {};

$("[type='text/x-handlebars']").each(function(){
  var $template = $(this);

  templates[$template.attr("id")] = Handlebars.compile($template.html());
});

App.TodoView = new ViewConstructor({
  tag_name: "li", 
  template: templates.todo,
  events: {
    "click .todo": App.showModal,
    "click .delete_item": App.removeItem
  }
});



App.init();