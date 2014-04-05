(function () {
  var LibraryBase = Odin.Resource.extend(
      'LibraryBase', {},
      // Meta
      {
        abstract: true,
        namespace: 'test.library'
      }
  );

  var Library = LibraryBase.extend(
      'LibraryBase',
      // Fields
      {
        name: new Odin.Field(),
        size: new Odin.IntegerField()
      }
  );

  var Book = LibraryBase.extend(
      'Book',
      {}
  );

  //test()

}());
