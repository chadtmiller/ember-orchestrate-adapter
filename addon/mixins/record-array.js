import Ember from 'ember';

var Promise = Ember.RSVP.Promise;
var get = Ember.get;
var set = Ember.set;

export default Ember.Mixin.create({
  hasNext: null,

  init: function() {
    this._super();
    var type = get(this, 'type');
    var meta = this.store.metadataFor(type);
    set(this, 'meta', meta);
  },

  metaDidChange: function() {
    var next = get(this, 'meta.next');
    set(this, 'hasNext', !!next);
  }.observes('meta'),

  loadMore: function() {
    var array = this;
    var store = get(this, 'store');
    var type = get(this, 'type');
    var adapter = this.store.adapterFor(type);
    var serializer = this.store.serializerFor(type.typeKey);
    var meta = get(this, 'meta');

    if (!meta.next) {
      return;
    }

    return new Promise(function(resolve, reject) {
      adapter.ajax(adapter.urlPrefix()+meta.next, 'GET')
        .then(function(adapterPayload) {
          var meta = {
            count: adapterPayload.count,
            next: adapterPayload.next && adapterPayload.next.slice(3),
            total: adapterPayload.total_count
          };
          var payload = serializer.extractArray(store, type, adapterPayload, null);
          var records = store.pushMany(type, payload);

          records.forEach(function(record) {
            array.addObject(record);
          });

          store.metaForType(type, meta);
          set(array, 'meta', meta);
          resolve(array);
        }, function(reason) {
          reject(reason.responseJSON);
        });
    });
  }
});
