(function () {
  var LibraryBase = Odin.Resource.extend(
      // Fields
      {},
      // Meta
      {
        name: 'LibraryBase',
        abstract: true,
        namespace: 'test.library'
      }
  );

  var Library = LibraryBase.extend(
      // Fields
      {
        name: new Odin.StringField,
        size: new Odin.IntegerField
      },
      // Meta
      {
        name: 'Library'
      }
  );

  var Book = LibraryBase.extend(
      // Fields
      {},
      // Meta
      {
        name: 'Book'
      }
  );

  //test()

}());
