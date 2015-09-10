//     Odin.js 0.1.0

(function(root, factory) {
  // Set up Odin appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'lodash', 'exports'], function(Backbone, _, exports) {
      root.Odin = factory(root, exports, Backbone, _);
    });

  // Next for Node.js or CommonJS.
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone'),
        _ = require('lodash');
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

  // Create local references to array methods we’ll want to use later.
  var array = [],
    slice = array.slice,
    splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Odin.VERSION = '0.1.0';

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Odin.noConflict = function () {
      root.Odin = previousOdin;
      return this;
  };

  // Internal resource cache.
  var resourceTypeCache = {};
  Odin._addResource = function (resource) {
    resourceTypeCache[resource.prototype._meta.getFullName()] = resource;
  };
  Odin._getResource = function (resourceName) {
    return resourceTypeCache[resourceName];
  };
  Odin._clearResources = function () {
    console.warn('This should only be used for test cases!');
    resourceTypeCache = {};
  };


  // Odin.ValidationError
  // --------------------

  // Error raised when validation fails
  var ValidationError = Odin.ValidationError = function (message, code, params) {
    this.name = "ValidationError";

    if (_.isObject(message)) {
      this.messageObject = message;
    } else if (_.isArray(message)) {
      this.messages = message;
    } else {
      this.messages = [message];
      this.code = code;
      this.params = params;
    }
  };
  ValidationError.prototype = new Error();
  ValidationError.prototype.toString = function () {
    if (typeof this.messageObject !== 'undefined') {
      return _.reduce(this.messageObject, function (result, field, msg) {
        result += field + ": " + msg.toString() + "\n";
        return result;
      });
    } else {
      return this.messages.toString()
    }
  };
  ValidationError.prototype.errorMessages = function () {
    if (typeof this.messageObject !== 'undefined') {
      return this.messageObject;
    } else {
      return this.messages;
    }
  };
  ValidationError.constructor = ValidationError;


  // Validators
  // ----------
  var v = Odin.validators = {
    // MinValueValidator
    // -----------------

    // Validates that a value is greater than or equal to a particular value
    minValueValidator: function (minValue) {
      return function (value) {
        if (value < minValue) {
          throw new ValidationError(
            "Ensure this value is greater than or equal to " + minValue,
            'min_value', {'minValue': minValue}
          );
        }
      };
    },

    // MaxValueValidator
    // -----------------

    // Validates that a value is less than or equal to a particular value
    maxValueValidator: function (maxValue) {
      return function (value) {
        if (value > maxValue) {
          throw new ValidationError(
            "Ensure this value is less than or equal to " + maxValue,
            'max_value', {'maxValue': maxValue});
        }
      };
    },

    // MinLengthValidator
    // -----------------

    // Validates that a length of the value is greater than or equal to a particular value
    minLengthValidator: function (minLength) {
      return function (value) {
        if (value.length < minLength) {
          throw new ValidationError(
            "Ensure this value has at least " + minLength + " characters (it has " + value.length + ").",
            'min_length', {'minValue': minLength}
          );
        }
      };
    },

    // MaxValueValidator
    // -----------------

    // Validates that a length of the value is less than or equal to a particular value
    maxLengthValidator: function (maxLength) {
      return function (value) {
        if (value.length > maxLength) {
          throw new ValidationError(
            "Ensure this value has at most " + maxLength + " characters (it has " + value.length + ").",
            'max_length', {'maxLength': maxLength}
          );
        }
      };
    }
  };


  // Odin.BaseField
  // --------------
  var fieldCreationCounter = 0;

  var BaseField = Odin.BaseField = function (options) {
    _.extend(this, {
      verboseName: null,
      verboseNamePlural: null,
      name: null,
      allowNull: false,
      choices: null,
      useDefaultIfNotProvided: false,
      defaultValue: undefined,
      validators: [],
      errorMessages: {},
      docText: null
    }, options);

    _.extend(this.errorMessages, this.defaultErrorMessages, this.errorMessages);
    this.creationCounter = fieldCreationCounter++;
  };

  // Set up all inheritable **Odin.BaseField** properties and methods.
  _.extend(BaseField.prototype, {
    defaultErrorMessages: {
      'invalid_choice': "Value is not a valid choice.",
      'null': "This field cannot be null.",
      'required': "This field is required."
    },

    setAttributesFromName: function (attname) {
      if (this.name === null) {
        this.name = attname;
      }
      this.attname = attname;
      if (this.verboseName === null) {
        this.verboseName = this.name.replace('_', ' ');
      }
      if (this.verboseNamePlural === null) {
        this.verboseNamePlural = this.verboseName + 's';
      }
    },

    contributeToObject: function (obj, name) {
      this.setAttributesFromName(name);
      this.resource = obj;
      obj.prototype._meta.addField(this);
    },

    // Convert a value to a native JavaScript type.
    toJavaScript: function (value) {
      return value;
    },

    runValidators: function (value) {
      if (isEmpty(value)) {
        return;
      }

      var errors = [];
      _.each(this.validators, function (validator) {
        try {
          validator(value);
        } catch (e) {
          if (e instanceof ValidationError) {
            if (_.has(e, 'code') && _.contains(this.errorMessages, e.code)) {
              var message = this.errorMessages[e.code];
              errors.push(message);
            } else {
              errors.push(e.errorMessages());
            }
          } else {
            throw e;
          }
        }
      }, this);

      if (errors.length) {
        throw new ValidationError(errors);
      }
    },

    getChoices: function () {
      if (_.isFunction(this.choices)) {
        return this.choices();
      }
      return this.choices;
    },

    validate: function (value) {
      var choices = this.getChoices();
      if (choices !== null && !isEmpty(value)) {
        if (_.any(choices, function (v){ return v[0] === value; })) {
          return;
        }
        throw new ValidationError(this.errorMessages.invalid_choice);
      }

      if (value === null && !this.allowNull) {
        throw new ValidationError(this.errorMessages['null']);
      }
    },

    // Convert the value's type and run validation. Validation errors from
    // toJavaScript and validate are propagated. The correct value is returned
    // if no error is raised.
    clean: function (value) {
      if (typeof value === 'undefined') {
        value = this.useDefaultIfNotProvided ? this.getDefault() : null;
      }
      value = this.toJavaScript(value);
      this.validate(value);
      this.runValidators(value);
      return value;
    },

    // Returns a boolean of whether this field has a default value.
    hasDefault: function() {
      return !_.isUndefined(this.defaultValue);
    },

    // Returns the default value for this field.
    getDefault: function () {
      return _.result(this, 'defaultValue');
    },

    // Returns the value of this field in the given resource instance.
    valueFromObject: function (obj) {
      return _.has(obj, this.attname) ? obj[this.attname] : undefined;
    },

    // Prepare value for use in JSON format.
    toJSON: function (value) {
      return value;
    }
  });

  // Odin.BooleanField
  // -----------------

  Odin.BooleanField = function (options) {
    BaseField.prototype.constructor.call(this, options);
  };

  // Setup all inheritable **Odin.BooleanField** properties and methods.
  _.extend(Odin.BooleanField.prototype, BaseField.prototype, {
    toJavaScript: function (value) {
      if (isEmpty(value)) {
        return null;
      }

      // Check for "falsy" strings
      if (_.includes(['false', 'off', 'no', '0'], value)) {
        return false;
      }

      value = Boolean(value);
      if (value === null) {
        throw new ValidationError('Invalid boolean value.')
      }
      return value;
    }
  });

  // Odin.IntegerField
  // -----------------

  Odin.IntegerField = function (options) {
    BaseField.prototype.constructor.call(this, options);

    if (_.isNumber(this.minValue)) {
      this.validators.push(v.minValueValidator(this.minValue));
    }
    if (_.isNumber(this.maxValue)) {
      this.validators.push(v.maxValueValidator(this.maxValue));
    }
  };

  // Setup all inheritable **Odin.IntegerField** properties and methods.
  _.extend(Odin.IntegerField.prototype, BaseField.prototype, {
    toJavaScript: function (value) {
      if (isEmpty(value)) {
        return null;
      }

      var len = value.length;
      value = parseInt(value, 10);
      if (isNaN(value) || value === null && len > 0) {
        throw new ValidationError('Invalid integer value.');
      }
      return value;
    }
  });

  // Odin.FloatField
  // -----------------

  // Field that represents a integer.
  var FloatField = Odin.FloatField = function (options) {
    BaseField.prototype.constructor.call(this, options);
  };

  // Setup all inheritable **odin.ObjectAs** properties and methods.
  _.extend(FloatField.prototype, BaseField.prototype, {
    // Convert a value to a field type
    toJavaScript: function (value) {
      if (isEmpty(value)) {
        return null;
      }

      // Ensure that float parsing doesn't silently return null.
      var length = value.length;
      value = parseFloat(value);
      if ((value === null || _.isNaN(value)) && length > 0) {
        throw new ValidationError("Invalid float value");
      }
      return value;
    }
  });

  // Odin.StringField
  // -----------------

  Odin.StringField = function (options) {
    BaseField.prototype.constructor.call(this, options);

    if (_.isNumber(this.minLength)) {
      this.validators.push(v.minLengthValidator(this.minLength));
    }
    if (_.isNumber(this.maxLength)) {
      this.validators.push(v.maxLengthValidator(this.maxLength));
    }
  };

  // Setup all inheritable **Odin.StringField** properties and methods.
  _.extend(Odin.StringField.prototype, BaseField.prototype, {});

  // Odin.ArrayField
  // ---------------

  Odin.ArrayField = function (options) {
    BaseField.prototype.constructor.call(this, options);
  };

  // Setup all inheritable **Odin.ArrayField** properties and methods.
  _.extend(Odin.ArrayField.prototype, BaseField.prototype, {});


  // Odin.DictField
  // --------------

  Odin.DictField = function (options) {
    BaseField.prototype.constructor.call(this, options);
  };

  // Setup all inheritable **Odin.DictField** properties and methods.
  _.extend(Odin.DictField.prototype, BaseField.prototype, {});

  // Odin.ObjectAs field
  // -------------------

  // BaseField that contains a sub-resource.
  var ObjectAs = Odin.ObjectAs = function (resource, options) {
    this.containedResource = resource;

    BaseField.prototype.constructor.call(this, options);
  };

  // Setup all inheritable **odin.ObjectAs** properties and methods.
  _.extend(ObjectAs.prototype, BaseField.prototype, {
    // Convert a value to a field type
    toJavaScript: function (value) {
      if (value === null || _.isUndefined(value)) {
        return null;
      }
      if (value instanceof this.resource) {
        return value;
      }
      if (_.isObject(value)) {
        if (_.isUndefined(value._meta)) {
          return createResourceFromJson(value, this.containedResource);
        } else {
          return value;
      }
      }
      throw new ValidationError('Unknown value.'); // TODO: Decent error
    },

    // Prepare a value for insertion into a JSON structure
    toJSON: function (value) {
      return _.isNull(value) ? null : value.toJSON();
    }
  });

  // Odin.ArrayOf field
  // ------------------

  // Field that contains an array of resources.
  Odin.ArrayOf = function (resource, options) {
    this.containedResource = resource;

    options = _.extend({
      defaultValue: function () { return new ResourceArray(); }
    }, options);

    BaseField.prototype.constructor.call(this, options);
  };

  // Set up all inheritable **odin.ArrayOf** properties and methods.
  _.extend(Odin.ArrayOf.prototype, ObjectAs.prototype, {
    // Convert a value to field type
    toJavaScript: function (value) {
      if (value === null || _.isUndefined(value)) {
        return null;
      }
      if (value instanceof Odin.ResourceArray) {
        return value;
      }
      if (_.isArray(value)) {
        return new Odin.ResourceArray(_.map(value, function (v) {
          return ObjectAs.prototype.toJavaScript.call(this, v);
        }, this));
      }
      throw new ValidationError('Unknown array.'); // TODO: Decent error
    },

    // Prepare a value for insertion into a JSON structure.
    toJSON: function (value) {
      return value.toJSON();
    }
  });

  // Odin.DictOf field
  // -----------------

  // Field that contains a dict
  Odin.DictOf = function (resource, options) {
    this.containedResource = resource;

    options = _.extend({
      defaultValue: function () { return new ResourceDict(); }
    }, options);

    BaseField.prototype.constructor.call(this, options);
  };

  // Set up all inheritable **odin.DictOf** properties and methods.
  _.extend(Odin.DictOf.prototype, ObjectAs.prototype, {
    // Convert a value to field type
    toJavaScript: function (value) {
      if (value === null || _.isUndefined(value)) {
        return null;
      }
      if (value instanceof Odin.ResourceDict) {
        return value;
      }
      if (_.isObject(value)) {
        return new Odin.ResourceDict(_.mapValues(value, function (v) {
          return ObjectAs.prototype.toJavaScript.call(this, v);
        }, this));
      }
      throw new ValidationError('Invalid object.'); // TODO: Decent error
    },

    // Prepare a value for insertion into a JSON structure.
    toJSON: function (value) {
      return value.toJSON();
    }
  });

  // ResourceOptions
  // ---------------

  var META_OPTION_NAMES = ['name', 'namespace', 'abstract', 'typeField', 'verboseName', 'verboseNamePlural'],
      DEFAULT_TYPE_FIELD = '$';

  function ResourceOptions(metaOptions) {
    this.metaOptions = metaOptions || {};
    this.parents = [];
    this.fields = [];

    this.name = undefined;
    this.namespace = undefined;
    this.verboseName = null;
    this.verboseNamePlural = null;
    this.abstract = false;
    this.typeField = DEFAULT_TYPE_FIELD;
  }

  // Setup all inheritable **ResourceOptions** properties and methods.
  _.extend(ResourceOptions.prototype, {
    contributeToObject: function (obj) {
      obj.prototype._meta = this;

      if (this.metaOptions) {
        var keys = _.keys(this.metaOptions), unknownKeys = _.difference(keys, META_OPTION_NAMES);
        if (unknownKeys.length > 0) {
          throw new Error('Unknown meta option: ' + unknownKeys.join(', '));
        }
        _.extend(this, this.metaOptions);

        delete this.metaOptions;
      }

      if (_.isUndefined(this.name)) {
          throw new Error('Name not supplied.');
      }
      if (_.isNull(this.verboseName)) {
        this.verboseName = this.name.replace('_', ' ').trim('_ ');
      }
      if (_.isNull(this.verboseNamePlural)) {
        this.verboseNamePlural = this.verboseName + 's';
      }

      var parentMeta = obj.__super__._meta;
      if (!_.isUndefined(parentMeta)) {
        // Copy fields
        this.fields = parentMeta.fields.slice(0);

        if (_.isUndefined(this.namespace)) {
          this.namespace = parentMeta.namespace;
        }
      }
    },

    addField: function (field) {
      this.fields.push(field);
      this._fieldMap = undefined;
    },

    getFullName: function () {
      if (_.isUndefined(this._resourceName)) {
        this._resourceName = (_.isUndefined(this.namespace) ? '' : this.namespace + '.') + this.name;
      }
      return this._resourceName;
    },

    getFieldByName: function (name) {
      // Lazy generate a lookup map.
      if (_.isUndefined(this._fieldMap)) {
        var fieldMap = {};
        _.map(this.fields, function (f) { fieldMap[f.name] = f; });
        this._fieldMap = fieldMap;
      }
      return this._fieldMap[name];
    }
  });

  // Odin.Resource
  // -------------

  var Resource = Odin.Resource = function (values) {
    values = values || {};

    // Set resource fields to values supplied in values object. If a field is not supplied
    // use the field default.
    eachField(this, function (f) {
      var val = values[f.name];
      if (typeof val === 'undefined') {
        val = f.getDefault();
      }
      this[f.name] = val;
    }, this);

    // Append a CID so this model can be uniquely identified
    this.cid = _.uniqueId(this._meta.name);
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
      if (attr === null) {
        return;
      }

      // Handle both `"attr", value` and an object of multiple attr/value combinations.
      if (_.isObject(attr)) {
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
      _.each(attrs, function (value, attr) {
        var field = this._meta.getFieldByName(attr);
        if (_.isUndefined(field)) {
          throw new Error('Unknown field `' + attr + '`');
        }

        // Validate and assign value and track changes
        value = field.clean(value);
        if (this[attr] !== value) {
          changes.push(attr);
        }
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
      var errors = {};

      eachField(this, function (field) {
        var value = field.valueFromObject(this);
        try {
          this[field.attname] = field.clean(value);
        } catch (e) {
          if (e instanceof ValidationError) {
            errors[field.attname] = e.messages;
          } else {
            throw e;
          }
        }
      }, this);

      if (!_.isEmpty(errors)) {
        throw new ValidationError(errors);
      }
    },

    toString: function () {
      return "<" + this._meta.fullName + ">";
    },


    // Return a copy of the model's `attributes` object.
    toJSON: function() {
      var attributes = {};
      attributes[this._meta.typeField] = this._meta.getFullName();
      eachField(this, function (f) {
        attributes[f.name] = f.toJSON(f.valueFromObject(this));
      }, this);
      return attributes;
    }
  });

  // Custom version of extend that builds the internal meta object.
  Resource.extend = function (metaOptions, fields, protoProps, staticProps) {
    var parent = this,
        //baseMeta = _.has(parent, '_meta') ? parent.prototype._meta : null,
        NewResource = function(){ return parent.apply(this, arguments);};

    // Add static properties to the constructor function, if supplied.
    _.extend(NewResource, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = NewResource; };
    Surrogate.prototype = parent.prototype;
    NewResource.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) {
      _.extend(NewResource.prototype, protoProps);
    }

    // Set a convenience property in case the parent's prototype is needed
    // later.
    NewResource.__super__ = parent.prototype;

    // Add resource options (this will register itself as _meta)
    addToObject(NewResource, null, new ResourceOptions(metaOptions));

    // Register fields with the resource
    _.each(fields, function (field, name) {
      addToObject(NewResource, name, field);
    }, this);

    if (!NewResource.prototype._meta.abstract) {
      Odin._addResource(NewResource);
    }

    return NewResource;
  };

  // Odin.ResourceArray
  // ------------------

  var ResourceArray = Odin.ResourceArray = function (resources, options) {
    options || (options = {});
    if (options.resource) {
      this.resource = options.resource;
    }
    this.resources = this.models = resources || [];

    var self = this;
    Object.defineProperty(this, 'length', {
      get: function () { return self.resources.length; }
    })
  };

  // Set up all inheritable **Odin.ResourceArray** properties and methods.
  _.extend(ResourceArray.prototype, Backbone.Events, {
    // Add an element to the end of the array
    push: function (resource, options) {
      options || (options = {});
      this.resources.push(resource);
      if (!options.silent) {
        this.trigger('insert', this, this.resources.length - 1, [resource], options);
      }
    },

    // Remove and return the last element at the end of the array
    pop: function (options) {
      options || (options = {});
      var resource = this.resources.pop();
      if (!options.silent) {
        this.trigger('remove', this, this.resources.length, [resource], options);
      }
      return resource;
    },

    // Splice in additional resources
    splice: function (start, deleteCount, resources, options) {
      options || (options = {});

      // Get resources Array into a consistent type
      if (typeof resources === 'undefined') {
        resources = []
      } else if (resources instanceof Odin.ResourceArray) {
        // Unpack ResourceArray
        resources = resources.resources;
      } else if (resources instanceof Array) {
        // Ignore
      } else {
        // Generate an array of resources.
        resources = [resources];
      }

      var removed = splice.apply(this.resources, [start, deleteCount].concat(resources));
      if (!options.silent) {
        // TODO: Change to follow backbone order (model, collection, options, other) for each model
        if (removed.length) {
          this.trigger('removed', this, start, removed, options);

          _.each(removed, function (resource) {
            this.trigger('remove', resource, this, options);
          }, this);
        }
        if (resources.length) {
          // TODO: Change to follow backbone order (model, collection, options, other)
          this.trigger('insert', this, start, resources, options);

          _.each(resources, function (resource, idx) {
            this.trigger('add', resource, this, options, start + idx);
          }, this);
        }
        if (removed.length || resources.length) {
          this.trigger('update', this, options, resources, start);
        }
      }
    },

    // Return resources with matching attributes. Useful for simple cases of filter.
    where: function (attrs, first) {
      var matches = _.matches(attrs);
      return this[first ? 'find' : 'filter'](function (resource) {
        return matches(resource);
      });
    },

    // Return the first resource with matching attributes. Useful for simples cases of find.
    findWhere: function (attrs) {
      return this.where(attrs, true)
    },

    // Append a resource(s) to the end (this varies from push in that it can handle multiple resources)
    append: function (resource, options) {
      this.splice(this.resources.length, 0, resource, options);
    },

    // Insert a resource(s) at an arbitrary point
    insert: function (idx, resource, options) {
      this.splice(idx, 0, resource, options);
    },

    // Remove a resource at the idx
    remove: function (idx, options) {
      this.splice(idx, 1, [], options);
    },

    // Replace a resource at the idx
    replace: function (idx, resource, options) {
      this.splice(idx, 1, resource, options);
    },

    // Move a resource from one index to another.
    move: function (from_idx, to_idx, options) {
      if (from_idx === to_idx) return;
      options || (options = {});
      var resource = this.resources.splice(from_idx, 1);
      this.splice(to_idx, 0, resource, options);
      if (!options.silent) {
        this.trigger('move', this, from_idx, to_idx, resource, options);
      }
    },

    // Get value at index
    at: function (idx) {
      return this.resources[idx];
    },

    // Bulk replace all resources, passing null to resources will empty the collection.
    reset: function (resources, options) {
      options || (options = {});

      // Empty and refill if not null
      this.resources = this.models = [];
      if (!_.isNull(resources)) {
        this.splice(0, 0, resources, {silent: true});
      }

      if (!options.silent) {
        this.trigger('reset', this, options);
      }
    },

    toJSON: function () {
      return _.map(this.resources, function (r) {
        return r.toJSON();
      });
    }
  });

  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'findIndex'];

  _.each(methods, function(method) {
    ResourceArray.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.resources);
      return _[method].apply(_, args);
    };
  });

  // Odin.ResourceDict
  // -------------------

  var ResourceDict = Odin.ResourceDict = function (resources, options) {
    options || (options = {});
    if (options.resource) {
      this.resource = options.resource;
    }
    this.resources = this.models = resources || {};

    var self = this;
    Object.defineProperty(this, 'length', {
      get: function () { return _.size(self.resources); }
    })
  };
  // Set up all inheritable **Odin.ResourceDict** properties and methods.
  _.extend(ResourceDict.prototype, Backbone.Events, {
    // Add an element to the object
    add: function (key, resource, options) {
      options || (options = {});
      this.resources[key] = resource;
      if (!options.silent) {
        this.trigger('add', resource, this, options);
      }
    },

    // Remove an element from the object
    remove: function (key, options) {
      options || (options = {});
      var resource = this.resources[key];
      if (_.undefined(resource)) return;
      if (!options.silent) {
        this.trigger('remove', resource, this, options);
      }
      return resource;
    },

    // Bulk replace all resources, passing null to resources will empty the collection.
    reset: function (resources, options) {
      options || (options = {});

      // Empty and refill if not null
      this.resources = this.models = {};
      if (!_.isObject(resources)) {
        this.resources = this.models = resources;
      } else {
        this.resources = this.models = {};
      }

      if (!options.silent) {
        this.trigger('reset', this, options);
      }
    },

    toJSON: function () {
      return _.mapValues(this.resources, function (r) {
        return r.toJSON();
      });
    }
  });

  methods = ['forEach', 'each', 'map', 'isEmpty'];

  _.each(methods, function(method) {
    ResourceDict.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.resources);
      return _[method].apply(_, args);
    };
  });

  // Helpers
  // -------

  // Create a resource instance from JSON data.
  var createResourceFromJson = Odin.createResourceFromJson = function(data, resource, options) {
    options = _.extend({
      fullClean: true,
      typeField: DEFAULT_TYPE_FIELD
    }, options || {});

    var key = _.isUndefined(resource) ? options.typeField : resource.prototype._meta.typeField,
        resourceName = data[key];
    // Fallback to defined resource if supplied.
    if (_.isUndefined(resourceName) && !_.isUndefined(resource)) {
      resourceName = (resource._meta || resource.prototype._meta).getFullName();
    }
    var resourceType = Odin._getResource(resourceName);
    if (_.isUndefined(resourceType)) {
      throw new Error('Resource type `' + resourceName + '` not defined');
    }

    var attrs = {}, errors = {}, fields = getFields(resourceType);
    var i, f, v;
    for (i in fields) {
      f = fields[i];
      v = f.valueFromObject(data);
      try {
        attrs[f.name] = f.toJavaScript(v);
      } catch (e) {
        if (e instanceof ValidationError) {
          errors[f.name] = e.errorMessages();
        } else {
          throw e;
        }
      }
    }

    if (!_.isEmpty(errors)) {
      throw new ValidationError(errors);
    }

    var newResource = new resourceType(attrs);
    if (options.fullClean) {
      newResource.fullClean();
    }
    return newResource;
  };

  Odin.buildObjectGraph = function(data, resource) {
    if (_.isArray(data)) {
      return new ResourceArray(_.map(data, function (d) {
          return createResourceFromJson(d, resource);
        }), resource);
    }

    if (_.isObject(data)) {
      return createResourceFromJson(data, resource);
    }

    return data;
  };

  // Add a object to a class, if it has a contribute method use that.
  function addToObject(cls, name, value) {
    if (_.isFunction(value.contributeToObject)) {
      value.contributeToObject(cls, name);
    } else {
      cls[name] = value;
    }
  }

  function getFields(resource) {
    if (_.isFunction(resource)) {
      return resource.prototype._meta.fields;
    } else {
      return resource._meta.fields;
    }
  }

  // A foreach style method to return all fields on a resource
  var eachField = Odin.eachField = function (resource, iterator, context) {
    if (_.isFunction(resource)) {
      return _.each(resource.prototype._meta.fields, iterator, context);
    } else {
      return _.each(resource._meta.fields, iterator, context);
    }
  };

  // Returns true if the supplied value is "empty"
  var isEmpty = Odin.isEmpty = function (value) {
      return _.isNull(value) || _.isUndefined(value) || value === '';
  };

  return Odin;
}));
