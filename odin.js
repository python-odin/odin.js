//     Odin.js 0.1.0

(function(root, factory) {
  // Set up Odin appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['Backbone', 'underscore', 'exports'], function(Backbone, _, exports) {
      root.Odin = factory(root, exports, Backbone, _);
    });

  // Next for Node.js or CommonJS.
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('Backbone'),
        _ = require('underscore');
    factory(root, exports, Backbone, _);

  // Finally, as a browser global.
  } else {
    root.Odin = factory(root, {}, root.Backbone, root._);
  }
}(this, function(root, Odin, Backbone, _) {

  // Initial Setup
  // -------------

  // Save the previous value of
  var previousOdin = root.Odin;

  // Create local references to array methods we'll want to use later.
  var foreach = _.each;

  // Current version of the library. Keep in sync with `package.json`.
  Odin.VERSION = '0.1.0';

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Odin.noConflict = function () {
      root.Odin = previousOdin;
      return this;
  };

  // Odin.ValidationError
  // --------------------

  // Error raised when validation fails
  var ValidationError = Odin.ValidationError = function (message, code) {
    this.name = "ValidationError";
    this.messsage = message;
    this.code = code;
  };
  ValidationError.prototype = new Error();
  ValidationError.prototype.constructor = ValidationError;

  // Odin.Field
  // ----------
  var fieldCreationCounter = 0;

  var Field = Odin.Field = function (options) {
    _.extend(this, {
      verboseName: null,
      verboseNamePlural: null,
      name: null,
      allowNull: false,
      choices: null,
      useDefaultIfNotProvided: false,
      defaultValue: undefined,
      validators: [],
      errorMessages: {}
    }, options);

    this.creationCounter = fieldCreationCounter++;

    _.extend(this.errorMessages, {

    }, this.errorMessages);
  };

  // Set up all inheritable **Odin.Field** properties and methods.
  _.extend(Field.prototype, {
    defaultErrorMessages: {
      'invalid_choice': "Value is not a valid choice.",
      'null': "This field cannot be null.",
      'required': "This field is required."
    },

    setAttributesFromName: function (attname) {
      if (this.name == null) {
        this.name = attname;
      }
      this.attname = attname;
      if (this.verboseName == null) {
        this.verboseName = this.name.replace('_', ' ');
      }
      if (this.verboseNamePlural == null) {
        this.verboseNamePlural = this.verboseName + 's';
      }
    },

    contributeToResource: function (resource, name) {
      this.setAttributesFromName(name);
      this.resource = resource;
      resource._meta.addField(this);
    },

    // Convert a value to a native JavaScript type.
    toJavaScript: function (value) {
      return value;
    },

    runValidators: function (value) {
      if (isEmpty(value)) return;

      var errors = [];
      foreach(this.validators, function (validator) {
        try {
          validator(value);
        } catch (e) {
          if (e instanceof ValidationError) {

          } else {
            throw e;
          }
        }
      }, this);

      if (errors.length) {

      }
    },

    validate: function (value) {

    },

    // Convert the value's type and run validation. Validation errors from
    // toJavaScript and validate are propagated. The correct value is returned
    // if no error is raised.
    clean: function (value) {
      value = this.toJavaScript(value);
      this.validate(value);
      return value;
    },

    // Returns a boolean of whether this field has a default value.
    hasDefault: function() {
      return typeof this.defaultValue === 'undefined';
    },

    // Returns the default value for this field.
    getDefault: function () {
      if (this.hasDefault()) {
        var defaultValue = this.defaultValue;
        return (typeof defaultValue === 'function') ? defaultValue() : defaultValue;
      }
      return null;
    },

    // Returns the value of this field in the given resource instance.
    valueFromObject: function (obj) {
      return obj.hasOwnProperty(this.name) ? obj[this.name] : undefined;
    },

    // Prepare value for use in JSON format.
    toJSON: function (value) {
      return value;
    }
  });

  // Odin.Resource
  // -------------

  var Resource = Odin.Resource = function (values) {
    values = values || {};

    // Set resource fields to values supplied in values object. If a field is not supplied
    // use the field default.
    eachField(this, function (field) {
      var val = values[f.name];
      if (typeof val === 'undefined') {
        val = f.getDefault();
      }
      this[f.name] = val;
    }, this);
  };

  // Set up all inheritable **Odin.Resource** properties and methods.
  _.extend(Resource.prototype, Backbone.Events, {
    // Get a value of a field from the resource
    get: function (attr) {
      return this[attr];
    },

    // Set a value on the resource
    set: function (attr, value, options) {
      var attrs, silent, changes;
      if (name === null) return;

      // Handle both `"attr", value` and an object of multiple attr/value combinations.
      if (typeof name === 'object') {
        attrs = attr;
        options = value;
      } else {
        (attrs = {})[attr] = value;
      }

      options || (options = {});

      // Extract attributes and options.
      silent = options.silent;
      changes = [];

      // Set values on the resources
      foreach(attrs, function (value, attr) {
        var field = this._meta.fields[attr];
        if (typeof field === 'undefined') throw new Error('Unknown field `' + attr + '`');

        // Validate and assign value and track changes
        value = field.clean(value);
        if (this[attr] !== value) changes.push(attr);
        this[attr] = value;
      }, this);

      // Trigger change events
      if (!silent) {
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, this[changes[i]], options);
        }
        if (changes.length) {
          this.trigger('change', this, options);
        }
      }
    },

    fullClean: function () {

    },

    toString: function () {

    },

    toJSON: function () {

    }
  });

  // Helpers
  // -------

  // A foreach style method to return all fields on a resource
  var eachField = Odin.eachField = function (resource, iterator, context) {
    return _.each(resource._meta.fields, iterator, context);
  };

  // Returns true if the supplied value is "empty"
  var isEmpty = Odin.isEmpty = function(value) {
      return value === null || _.isUndefined(value) || value === '';
  };

}));
