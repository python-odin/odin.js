(function () {
  // Odin.Field
  // ----------
  test("hasDefault", function () {
    var field = new Odin.Field({defaultValue: 123});

    ok(field.hasDefault());
    equal(field.getDefault(), 123);
  });

  test("noDefault", function () {
    var field = new Odin.Field();

    ok(!field.hasDefault());
    equal(field.getDefault(), null);
  });

  test("setAttributesFromName", function () {
    var field = new Odin.Field();

    equal(field.name, null);
    field.setAttributesFromName('a_name');
    equal(field.name, 'a_name');
    equal(field.attname, 'a_name');
    equal(field.verboseName, 'a name');
    equal(field.verboseNamePlural, 'a names');
  });

  test("setAttributesFromName name specified", function () {
    var field = new Odin.Field({name: 'dave'});

    equal(field.name, 'dave');
    field.setAttributesFromName('a_name');
    equal(field.name, 'dave');
    equal(field.attname, 'a_name');
    equal(field.verboseName, 'dave');
    equal(field.verboseNamePlural, 'daves');
  });

  test("clean null", function () {
    throws(function () {
      (new Odin.Field()).clean(null);
    }, Odin.ValidationError, 'Not null');

    equal((new Odin.Field({allowNull:true})).clean(null), null)

  });

  // Odin.IntegerField
  // -----------------

  // Odin.StringField
  // ----------------

}());
