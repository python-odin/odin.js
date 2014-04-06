(function () {
  test('isEmpty', function () {
    ok(Odin.isEmpty(null));
    ok(Odin.isEmpty(undefined));
    ok(Odin.isEmpty(''));
    ok(!Odin.isEmpty('abc'));
    ok(!Odin.isEmpty(123));
  });

//  test('setDefault', function () {
//    var data = {foo: 'bar'};
//
//    equal(data.foo, 'bar');
//    equal(Odin.setDefault(data, 'foo'), 'bar');
//    equal(Odin.setDefault(data, 'foo', 'eek'), 'bar');
//    equal(Odin.setDefault(data, 'eek'), null);
//    equal(Odin.setDefault(data, 'abc', 'def'), 'def');
//    deepEqual(data, {foo: 'bar', 'eek': null, 'abc': 'def'})
//  });
}());
