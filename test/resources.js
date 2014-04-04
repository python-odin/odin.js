(function () {
  var LibraryBase = Odin.Resource.extend(
      'LibraryBase',
      // Fields
      {
        name: new Odin.Field(),
        size: new Odin.IntegerField()
      },

      // Meta
      {
        abstract: true
      }
  );

  var Library = LibraryBase.extend('Library', {});
}());
