'use strict';

var testUtils = require('../testUtils');
var dnsimple = require('../../lib/dnsimple')({
  accessToken: testUtils.getAccessToken()
});

const expect = require('chai').expect;
const nock = require('nock');

describe('certificates', function () {
  describe('#listCertificates', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var fixture = testUtils.fixture('listCertificates/success.http');

    it('supports pagination', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?page=1')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.listCertificates(accountId, domainId, { page: 1 });

      nock.isDone();
      done();
    });

    it('supports extra request options', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?foo=bar')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.listCertificates(accountId, domainId, { query: { foo: 'bar' } });

      nock.isDone();
      done();
    });

    it('supports sorting', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?sort=expires_on%3Aasc')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.listCertificates(accountId, domainId, { sort: 'expires_on:asc' });

      nock.isDone();
      done();
    });

    it('produces a certificate list', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.listCertificates(accountId, domainId).then(function (response) {
        var certificates = response.data;
        expect(certificates.length).to.eq(2);
        expect(certificates[0].id).to.eq(101973);
        expect(certificates[0].domain_id).to.eq(14279);
        expect(certificates[0].common_name).to.eq('www2.dnsimple.us');
        done();
      }, function (error) {
        done(error);
      });
    });

    it('exposes the pagination info', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.listCertificates(accountId, domainId).then(function (response) {
        var pagination = response.pagination;
        expect(pagination).to.not.eq(null);
        expect(pagination.current_page).to.eq(1);
        done();
      }, function (error) {
        done(error);
      });
    });
  });

  describe('#allCertificates', function () {
    var accountId = '1010';
    var domainId = 'example.com';

    it('produces a complete list', function (done) {
      var fixture1 = testUtils.fixture('pages-1of3.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?page=1')
        .reply(fixture1.statusCode, fixture1.body);

      var fixture2 = testUtils.fixture('pages-2of3.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?page=2')
        .reply(fixture2.statusCode, fixture2.body);

      var fixture3 = testUtils.fixture('pages-3of3.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates?page=3')
        .reply(fixture3.statusCode, fixture3.body);

      dnsimple.certificates.allCertificates(accountId, domainId).then(function (certificates) {
        expect(certificates.length).to.eq(5);
        expect(certificates[0].id).to.eq(1);
        expect(certificates[4].id).to.eq(5);
        done();
      }, function (error) {
        done(error);
      }).catch(function (error) {
        done(error);
      });
    });
  });

  describe('#getCertificate', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 1;
    var fixture = testUtils.fixture('getCertificate/success.http');

    it('produces a certificate', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/1')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.getCertificate(accountId, domainId, certificateId).then(function (response) {
        var certificate = response.data;
        expect(certificate.id).to.eq(101967);
        expect(certificate.domain_id).to.eq(289333);
        expect(certificate.contact_id).to.eq(2511);
        expect(certificate.common_name).to.eq('www.bingo.pizza');
        expect(certificate.alternate_names).to.eql([]);
        expect(certificate.state).to.eq('issued');
        expect(certificate.expires_on).to.eq('2020-09-16');
        done();
      }, function (error) {
        done(error);
      });
    });

    describe('when the certificate does not exist', function () {
      var fixture = testUtils.fixture('notfound-certificate.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/0')
        .reply(fixture.statusCode, fixture.body);

      it('produces an error', function (done) {
        dnsimple.certificates.getCertificate(accountId, domainId, 0).then(function (response) {
          done();
        }, function (error) {
          expect(error).to.not.eq(null);
          expect(error.description).to.eq('Not found');
          expect(error.message).to.eq('Certificate `0` not found');
          done();
        });
      });
    });
  });

  describe('#downloadCertificate', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 1;
    var fixture = testUtils.fixture('downloadCertificate/success.http');

    it('produces a certificate', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/1/download')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.downloadCertificate(accountId, domainId, certificateId).then(function (response) {
        var certificate = response.data;
        expect(certificate.server).to.match(/-----BEGIN CERTIFICATE-----/);
        expect(certificate.root).to.eq(null);
        expect(certificate.chain.length).to.eq(1);
        expect(certificate.chain[0]).to.match(/-----BEGIN CERTIFICATE-----/);
        done();
      }, function (error) {
        done(error);
      });
    });

    describe('when the certificate does not exist', function () {
      var fixture = testUtils.fixture('notfound-certificate.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/0/download')
        .reply(fixture.statusCode, fixture.body);

      it('produces an error', function (done) {
        dnsimple.certificates.downloadCertificate(accountId, domainId, 0).then(function (response) {
          done();
        }, function (error) {
          expect(error).to.not.eq(null);
          done();
        });
      });
    });
  });

  describe('#getCertificatePrivateKey', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 1;
    var fixture = testUtils.fixture('getCertificatePrivateKey/success.http');

    it('produces a certificate', function (done) {
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/1/private_key')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.getCertificatePrivateKey(accountId, domainId, certificateId).then(function (response) {
        var certificate = response.data;
        expect(certificate.private_key).to.match(/-----BEGIN RSA PRIVATE KEY-----/);
        done();
      }, function (error) {
        done(error);
      });
    });

    describe('when the certificate does not exist', function () {
      var fixture = testUtils.fixture('notfound-certificate.http');
      nock('https://api.dnsimple.com')
        .get('/v2/1010/domains/example.com/certificates/0/private_key')
        .reply(fixture.statusCode, fixture.body);

      it('produces an error', function (done) {
        dnsimple.certificates.getCertificatePrivateKey(accountId, domainId, 0).then(function (response) {
          done();
        }, function (error) {
          expect(error).to.not.eq(null);
          done();
        });
      });
    });
  });

  describe('#purchaseLetsencryptCertificate', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var attributes = { contact_id: 1 };
    var fixture = testUtils.fixture('purchaseLetsencryptCertificate/success.http');

    it('purchases a certificate', function (done) {
      nock('https://api.dnsimple.com')
        .post('/v2/1010/domains/example.com/certificates/letsencrypt')
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.purchaseLetsencryptCertificate(accountId, domainId, attributes).then(function (response) {
        var certificate = response.data;
        expect(certificate.id).to.eq(101967);
        done();
      }, function (error) {
        done(error);
      });
    });
  });

  describe('#issueLetsencryptCertificate', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 101967;
    var fixture = testUtils.fixture('issueLetsencryptCertificate/success.http');

    it('issues a certificate', function (done) {
      nock('https://api.dnsimple.com')
        .post(`/v2/1010/domains/example.com/certificates/letsencrypt/${certificateId}/issue`)
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.issueLetsencryptCertificate(accountId, domainId, certificateId).then(function (response) {
        var certificate = response.data;
        expect(certificate.id).to.eq(certificateId);
        done();
      }, function (error) {
        done(error);
      });
    });
  });

  describe('#purchaseLetsencryptCertificateRenewal', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 101967;
    var fixture = testUtils.fixture('purchaseRenewalLetsencryptCertificate/success.http');

    it('purchases a certificate renewal', function (done) {
      nock('https://api.dnsimple.com')
        .post(`/v2/1010/domains/example.com/certificates/letsencrypt/${certificateId}/renewal`)
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.purchaseLetsencryptCertificateRenewal(accountId, domainId, certificateId)
        .then(function (response) {
          var certificateRenewal = response.data;
          expect(certificateRenewal.id).to.eq(65082);
          expect(certificateRenewal.old_certificate_id).to.eq(certificateId);
          expect(certificateRenewal.new_certificate_id).to.eq(101972);
          done();
        }, function (error) {
          done(error);
        });
    });
  });

  describe('#issueLetsencryptCertificateRenewal', function () {
    var accountId = '1010';
    var domainId = 'example.com';
    var certificateId = 101967;
    var certificateRenewalId = 65082;
    var newCertificateId = 101972;
    var fixture = testUtils.fixture('issueRenewalLetsencryptCertificate/success.http');

    it('issues a certificate renewal', function (done) {
      nock('https://api.dnsimple.com')
        .post(`/v2/1010/domains/example.com/certificates/letsencrypt/${certificateId}/renewals/${certificateRenewalId}/issue`)
        .reply(fixture.statusCode, fixture.body);

      dnsimple.certificates.issueLetsencryptCertificateRenewal(accountId, domainId, certificateId, certificateRenewalId)
        .then(function (response) {
          var newCertificate = response.data;
          expect(newCertificate.id).to.eq(newCertificateId);
          done();
        }, function (error) {
          done(error);
        });
    });
  });
});
