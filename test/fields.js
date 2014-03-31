(function () {
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

  test("setAttributesFromName", function () {
    var field = new Odin.Field();

    equal(field.name, null);
    field.setAttributesFromName('a_name');
    equal(field.name, 'a_name');
    equal(field.attname, 'a_name');
    equal(field.verboseName, 'a name');
    equal(field.verboseNamePlural, 'a names');
  });
}());
