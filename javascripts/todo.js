var App = {
  $main: $("main"),
  $todo_items: $("#todo_items"),
  $add_todo: $("#add_todo"),
  $complete: $("#completed"), 
  todo_list: [],
  countAdd: function(model) {
    var self = this,
        date = model.get("date") === undefined ? "No Due Day" : model.get("date"),
        matching;

    self.all_todo_counter.set("count", self.all_todo_counter.get("count") + 1);

    matching = self.counters.models.find(function(counter) {
      return counter.get("name") === date;
    });

    if (matching) {
      matching.set("count", matching.get("count") + 1);
    } else {
      self.counters.add({
        name: date, 
        count: 1
      });
    }

    self.renderTodoCount();
  },

  countSubtract: function(model) {
    var self = this, 
        date = model.get("date") === undefined ? "No Due Day" : model.get("date"),
        counter;

    self.all_todo_counter.set("count", self.all_todo_counter.get("count") - 1);

    counter = self.counters.models.filter(function(count){
      return count.get("name") === date;
    })[0];

    counter.set("count", counter.get("count") - 1)

    if (!counter.get("count")) {
      self.counters.remove(counter.get("id"));
    }

    self.renderTodoCount(model);
  },
  renderTodoCount: function() {
    var self = this,
        view;

      $(".all_todos").html("");

    App.counters.models.forEach(function(model){
      view = new App.CountItemView(model);
      $(".all_todos").append(view.$el);
    });
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
    App.countSubtract(model);
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
    var view,
      model = this.Todos.add({
      name: name, 
      complete: false,
      date: "No Due Day"
    });

    view = new this.TodoView(model);
    view.$el.appendTo(this.$todo_items);

    this.removeAddTodoForm();
    this.countAdd(model);
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
        left: $(window).scrollLeft() + (window.outerWidth / 2 - ($modal.width() / 2))
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

    this.countSubtract(model);

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

    App.countAdd(model);
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
  renderListTitle: function(all_todo) {
    var $select_list = $("aside").find(".active").closest("li"),
        date = $select_list.find("a").text(),
        count = $select_list.find("div").text(),
        all_todo_count = $("aside").find("li").eq(0).attr("count");

    if (all_todo) {
      $("#list_title").html(templates.list_title({date: "All Todos", count: all_todo_count}));
    } else {
      $("#list_title").html(templates.list_title({date: date, count: count}));
    }
    
  },
  selectDueDate: function(e) {
    e.preventDefault();

    var $this = $(e.target),
        $lis = $(".all_todos").find("li"),
        $li = $this.closest("li"), 
        date = $li.attr("name");

    $lis.removeClass("active");
    $li.addClass("active");
    $("aside").removeClass("show");

    this.renderListTitle();
    this.filterTodoItem(date);
  },
  filterTodoItem: function(date, complete) {

    var self = this,
        models;

    if (date === "All Todos") {
      models = self.Todos.models;
    } else {

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
    this.renderListTitle(true);
  }
};


App.Todo = new ModelConstructor({
  change: function() {
    App.storeLocally();
  }
});

App.TodosConstructor = new CollectionConstructor();
App.Todos = new App.TodosConstructor(App.Todo);

App.counter = new ModelConstructor();
App.countersConstructor = new CollectionConstructor();
App.counters = new App.countersConstructor(App.counter);

App.all_todo_counter = App.counters.add({
    name: "All Todos",
    count: 0
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

App.CountItemView = new ViewConstructor({
  tag_name: "li", 
  template: templates.due_todo_count,
  events: {
    "click .count_list": App.selectDueDate.bind(App)
  }
});




App.init();