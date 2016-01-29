function ModelConstructor(options) {
  var id_count = 0;

  function Model(attrs) {
    id_count++;

    var self = this;
    self.attributes = attrs || {};
    self.id = id_count;
    self.attributes.id = id_count;

    if (options && options.change && _.isFunction(options.change)) {
      this.__events.push(options.change);
    }
  }


  Model.prototype = {
    __events: [],
    __remove: function() { },
    set: function(key, val) {
      this.attributes[key] = val;
      this.triggerChange();
    },

    get: function(key) {
      return this.attributes[key];
    },
    remove: function(key) {
      delete this.attributes[key];
      this.triggerChange();
    },
    triggerChange: function() {
      this.__events.forEach(function(cb) {
        cb();
      });
    },
    addCallback: function(cb) {
      this.__events.push(cb);
    }
  };

  _.extend(Model.prototype, options);

  return Model;
}

function CollectionConstructor(options) {
  function Collection(model_constructor) {
    this.models = [];
    this.model = model_constructor;
  }

  Collection.prototype = {
    add: function(model) {
      var old_model = _(this.models).findWhere({ id: model.id}),
          new_model;

      if (old_model) { return old_model; }

      new_model = new this.model(model);
      this.models.push(new_model);

      return new_model;
    },
    reset: function() {
      this.models = [];
    },
    get: function(idx) {
      return _(this.models).findWhere( { id: idx });
    },
    set: function(models) {
      this.reset();
      models.forEach(this.add.bind(this));
    },
    remove: function(model) {
      model = _.isNumber(model) ? { id: model } : model;

      var m = _(this.models).findWhere(model);

      if(!m) { return; }

      m.__remove();
      this.models = this.models.filter(function(existing_m) {
        return existing_m.attributes.id !== m.id;
      });
    }

  }

  _.extend(Collection.prototype, options)

  return Collection;
}

function ViewConstructor(options) {
  function View(model) {
    this.model = model;
    this.model.addCallback(this.render.bind(this));
    this.model.__remove = this.remove.bind(this);
    this.model.view = this;
    this.$el = $("<" + this.tag_name + " />", this.model.attributes);
    this.render();
  }

  View.prototype = {
    tag_name: "div",
    attributes: {}, 
    template: function() { },
    events: {},
    render: function() {
      this.$el.html(this.template(this.model.attributes));
      this.bindEvents();
      return this.$el;
    },
    bindEvents: function() {
      var $el = this.$el,
          event, selector, parts;

      for (var prop in this.events) {
        parts = prop.split(" ");
        selector = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
        event = parts[0];
        if (selector) {
          $el.on(event + ".view" , selector, this.events[prop].bind(this));
        } else {
          $el.on(event + ".view" , this.events[prop].bind(this));
        }
      }
    },
    unbindEvents : function() {
      this.$el.off(".view");
    },
    remove: function() {
      this.unbindEvents();
      this.$el.remove();
    }
  };
  
  _.extend(View.prototype, options);

  return View;
}
