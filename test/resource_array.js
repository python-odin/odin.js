(function () {
  test('ResourceArray', function () {
    var a = new Odin.ResourceArray(['foo', 'bar']);

    equal(a.size(), 2);
    equal(a.at(1), 'bar');
    deepEqual(a.resources, ['foo', 'bar']);

    a.push('eek');
    equal(a.size(), 3);
    deepEqual(a.resources, ['foo', 'bar', 'eek']);

    equal(a.pop(), 'eek');
    equal(a.size(), 2);
    deepEqual(a.resources, ['foo', 'bar']);

    a.insert(1, 'eek');
    equal(a.size(), 3);
    deepEqual(a.resources, ['foo', 'eek', 'bar']);

    a.remove(1);
    equal(a.size(), 2);
    deepEqual(a.resources, ['foo', 'bar']);

    a.insert(1, 'eek');
    equal(a.size(), 3);
    deepEqual(a.resources, ['foo', 'eek', 'bar']);

    a.move(1, 2);
    equal(a.size(), 3);
    deepEqual(a.resources, ['foo', 'bar', 'eek']);

    a.move(2, 0);
    equal(a.size(), 3);
    deepEqual(a.resources, ['eek', 'foo', 'bar']);
  });
}());
