var App = {
  $main: $("main"),
  $todo_items: $("#todo_items"),
  $add_todo: $("#add_todo"),
  $complete: $("#completed"),
  todo_list: [],
  countTodoItems: function() {
    this.counter.set("todo_count", App.Todos.models.length);
    this.sortDate();
    this.renderTodoCount();
  },
  sortDate: function() {
    var self = this,
        dates = {
          "No Due Day": 0
        };

    self.Todos.models.forEach(function(model){
      if (model.get("date") === undefined) {
        dates["No Due Day"] += 1;
      } else {
        if (dates[model.get("date")]) {
          dates[model.get("date")] += 1;
        } else {
          dates[model.get("date")] = 1;
        }   
      }
    });

    self.renderDate(dates);
  },

  renderDate: function(dates) {
    var self = this;

    self.counter.set("dates", []);

    for (prop in dates) {
      var obj = {
        title: prop, 
        count: dates[prop]
      }
      self.counter.get("dates").push(obj);
    }   
  },
  renderTodoCount: function() {
    var model = this.counter,
        view = new this.counter.CountItemView(App.counter);

    $("#due").html(templates.due_todo_count({dates: model.get("dates")}));
    $("ul.all_todos").html(view.$el);
    
  },
  renderAddForm: function(e) {
    e.preventDefault();

    $("#add_todo").html(templates.add_todo_form);
    $("#add_todo").off("click");
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
    App.countTodoItems();
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
      date: "No Due Day"
    });

    view = new this.TodoView(model);
    view.$el.appendTo(this.$todo_items);

    this.removeAddTodoForm();
    this.countTodoItems();
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

    if (window.innerWidth < 700) {
      $modal.css({
        top: $(window).scrollTop() + 100, 
        left: $(window).scrollLeft()
      });
    } else {
      $modal.css({
        top: $(window).scrollTop() + 100,
        left: $(window).scrollLeft() + 100
      });
    }

    $modals.fadeIn(300);

    $modal.find(".complete").on("click", App.completeTask.bind(App));
    
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
      temp.date = App.formatDate(temp.date);
      for (prop in temp) {
        if (prop.startsWith("due")) {
          delete temp[prop];
        }
      }
    }

    for (prop in temp) {
      model.set(prop, temp[prop]);
    }

    App.countTodoItems();
    App.closeModal();
  },
  formatDate: function(date){
    var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return date.getDate() + "/" + months[date.getMonth()] + "/" + date.getFullYear();
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
    self.countTodoItems();
  },
  selectDueDate: function(e) {
    e.preventDefault();

    var $this = $(e.target),
        $lis = $("#due").find("li"),
        $li = $this.closest("li"), 
        date = $li.attr("id");

    $lis.removeClass("active");
    $li.addClass("active");
    $("aside").removeClass("show");

    this.filterTodoItem(date);
  },
  filterTodoItem: function(date, complete) {

    var self = this;

    if (!complete) {
      models = self.Todos.models.filter(function(model) {
        return model.get("date") === date;
      }); 
    }

    if (complete) {
       models = self.Todos.models.filter(function(model) {
        return model.get("date") === date && model.get("complete") === true;
      });
    }

    self.$todo_items.html('<li id="add_todo"><a href="#">Add new TODO</a></li>');
      self.$todo_items.on("click", self.$add_todo, self.renderAddForm.bind(self));

      models.forEach(function(model){
        self.renderFilterResult(model);
      });

    

    
    
    
  },
  renderFilterResult: function(model) {
    var view = new this.TodoView(model);
    view.$el.appendTo(this.$todo_items);
    
  },
  showSidebar: function(e) {
    e.preventDefault();
    
    $("aside").toggleClass("show", true);
  },
  bindAsideEvent: function() {
    $("aside").on("click", "#due li", this.selectDueDate.bind(this));
  },
  bindEvent: function() {
    this.$add_todo.on("click", this.renderAddForm.bind(this));
    this.$main.on("submit", "#add_item", this.getTodoName.bind(this));
    this.$main.on("click", "#mark_all_complete", this.markAllComplete.bind(this));
    this.$main.on("click", "#remove_all", this.removeAll.bind(this));
    this.$main.on("click", "a#menu_icon", this.showSidebar.bind(this));
  },
  init: function() {
    this.bindEvent();
    this.renderTodoCount();
    this.renderStoredItem();
    this.bindAsideEvent();
  }
};


App.Todo = new ModelConstructor({
  change: function() {
    App.storeLocally();
  }
});

App.TodosConstructor = new CollectionConstructor();

App.Todos = new App.TodosConstructor(App.Todo);

App.countTodo = new ModelConstructor();

App.counter = new App.countTodo({
  todo_count: 0, 
  dates: []

});

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
    "click .delete_item": App.removeItem,
    "submit .modal form": App.updateModel.bind(App)
  }
});

App.counter.CountItemView = new ViewConstructor({
  tag_name: "li", 
  template: templates.all_todo_count
});




App.init();