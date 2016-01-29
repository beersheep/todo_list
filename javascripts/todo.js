var App = {
  $main: $("main"),
  $sidebar: $("sidebar"),
  $add_todo: $("#add_todo"),
  renderAddForm: function(e) {
    e.preventDefault();

    this.$add_todo.html(templates.add_todo_form);
    this.$add_todo.off("click");
  },
  removeAddTodoForm: function() {
    this.$add_todo.html(templates.remove_todo_form);
    this.$add_todo.on("click", this.renderAddForm.bind(this));
  },
  addTodoItem: function(e) {
    e.preventDefault();
    var name = $(e.target).find("#todo_name").val(),
        model, 
        view;

    if (!name) { return; }

    model = this.Todos.add({
      name: name, 
      complete: false, 
    });

    view = new this.TodoView(model);
    view.$el.appendTo("#todo_items")

    this.removeAddTodoForm();

  },
  bindEvent: function() {
    this.$add_todo.on("click", this.renderAddForm.bind(this));
    this.$main.on("submit", "form", this.addTodoItem.bind(this));
  },
  init: function() {
    this.bindEvent();
  }
};

App.Todo = new ModelConstructor();
App.TodosConstructor = new CollectionConstructor();

App.Todos = new App.TodosConstructor(App.Todo);

var templates = {};

$("[type='text/x-handlebars']").each(function(){
  var $template = $(this);

  templates[$template.attr("id")] = Handlebars.compile($template.html());
});

App.TodoView = new ViewConstructor({
  tag_name: "li", 
  template: templates.todo
});

App.init();