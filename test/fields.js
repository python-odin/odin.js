(function () {
  // Odin.BaseField
  // --------------
  test("Odin.BaseField - hasDefault", function () {
    var field = new Odin.BaseField({defaultValue: 123});

    ok(field.hasDefault());
    equal(field.getDefault(), 123);
  });

  test("Odin.BaseField - noDefault", function () {
    var field = new Odin.BaseField();

    ok(!field.hasDefault());
    equal(field.getDefault(), null);
  });

  test("Odin.BaseField - setAttributesFromName", function () {
    var field = new Odin.BaseField();

    equal(field.name, null);
    field.setAttributesFromName('a_name');
    equal(field.name, 'a_name');
    equal(field.attname, 'a_name');
    equal(field.verboseName, 'a name');
    equal(field.verboseNamePlural, 'a names');
  });

  test("Odin.BaseField - setAttributesFromName name specified", function () {
    var field = new Odin.BaseField({name: 'dave'});

    equal(field.name, 'dave');
    field.setAttributesFromName('a_name');
    equal(field.name, 'dave');
    equal(field.attname, 'a_name');
    equal(field.verboseName, 'dave');
    equal(field.verboseNamePlural, 'daves');
  });

  test("Odin.BaseField - clean null", function () {
    throws(function () {
      (new Odin.BaseField()).clean(null);
    }, Odin.ValidationError, 'Not null');

    equal((new Odin.BaseField({allowNull:true})).clean(null), null)

  });

  // Odin.IntegerField
  // -----------------
  test("Odin.IntegerField - default", function () {
    var field = new Odin.IntegerField();

    strictEqual(field.clean(1), 1);
    strictEqual(field.clean('1'), 1);
    throws(function () { field.clean(null)}, Odin.ValidationError);
    throws(function () { field.clean("abc")}, Odin.ValidationError);
    throws(function () { field.clean("")}, Odin.ValidationError);
  });

  test("Odin.IntegerField - allow null", function () {
    var field = new Odin.IntegerField({allowNull: true});

    strictEqual(field.clean(1), 1);
    strictEqual(field.clean('1'), 1);
    strictEqual(field.clean(null), null);
    throws(function () { field.clean("abc")}, Odin.ValidationError);
    strictEqual(field.clean(""), null);
  });

  test("Odin.IntegerField - validators", function () {
    var field = new Odin.IntegerField({minValue: 10, maxValue: 20});

    field.validators =

    strictEqual(field.clean(1), 1);
    strictEqual(field.clean('1'), 1);
    strictEqual(field.clean(null), null);
    throws(function () { field.clean("abc")}, Odin.ValidationError);
    strictEqual(field.clean(""), null);
  });

  // Odin.StringField
  // ----------------

}());
