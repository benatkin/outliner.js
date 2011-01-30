(function() {
  describe('empty object', function() {
    beforeEach(function() {
      this.model = new Outliner.Model({});
    });
    describe('find', function() {
      it('returns a wrapped value', function() {
      });
    });
  });
  describe('an object with one key-value pair', function() {
    beforeEach(function() {
      this.model = new Outliner.Model({value: {"one": "two"}});
    });
    describe('find', function() {
      it('returns an object node, an empty node, and a close node', function() {
        this.model.find();
      });
    });
  });
}).call(this);
