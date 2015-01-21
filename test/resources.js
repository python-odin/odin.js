(function () {
  var LibraryBase = Odin.Resource.extend(
    // Meta
    {
      name: 'LibraryBase',
      abstract: true,
      namespace: 'test.library'
    },
    // Fields
    {}
  );

  var Library = LibraryBase.extend(
    // Meta
    {
      name: 'Library'
    },
    // Fields
    {
      name: new Odin.StringField,
      size: new Odin.IntegerField
    }
  );

  var Book = LibraryBase.extend(
    // Meta
    {
      name: 'Book'
    },
    // Fields
    {}
  );

  //test()

}());
