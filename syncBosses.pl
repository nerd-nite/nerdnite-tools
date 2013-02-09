#!/usr/bin/env perl

use strict;
use warnings;
use CpanelEmail;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;
use Log::Log4perl;

Readonly my %IGNORES => map { ("$_\@nerdnite.com" => 1) } (qw(web test sales letters magazine dan_test atx-paypal));

my $email = CpanelEmail->new();
Log::Log4perl::init('./perlLogging.conf');

my $logger = Log::Log4perl->get_logger('com.nerdnite.tools.syncBosses');

$logger->info('Gathering POP accounts');
my $pops     = $email->request('listpops');
$logger->info('Gathering Forwarders');
my $forwards = $email->request('listforwards');


$logger->info('Filtering Forwarders down to bosses@nerdnite.com');
my @bossesTargets;

_->each($forwards, sub {
    my $forward = shift;
    if($forward->{dest} eq 'bosses@nerdnite.com') {
        push @bossesTargets, $forward->{forward};
    }
});

$logger->info('Generating the list of all Forward targets');
my $emails = _->union(_->pluck($pops, 'email'), _->pluck($forwards, 'dest'));
$emails = _->sort($emails);

$emails = _->filter($emails => sub {
    my $email = shift;
    ($email !~ /^love/) &&
    ($email !~ /^boss(?:es)?\@/) &&
    ($email =~ /\@nerdnite\.com/) &&
    !$IGNORES{$email};
});

$logger->info('Determining the missing emails');
my $missing  = _->without($emails, @bossesTargets);
$logger->info('Determining the obselete emails');
my $toRemove = _->without(\@bossesTargets, @{$emails} );

$logger->info('Adding missing forwards '.(scalar @$missing));
_->each($missing, sub {
    my $emailAddress = shift;
    my $params = {
        domain      => 'nerdnite.com',
        email       => 'bosses',
        fwdopt      => 'fwd',
        fwdemail    => $emailAddress
    };
    $logger->info("Adding $emailAddress");
    my $result = $email->request('addforward', $params);
});

$logger->info('Removing excess forwards '.(scalar @$toRemove));
_->each($toRemove, sub {
    my $emailAddress = shift;
    my $params = [ "bosses\@nerdnite.com=$emailAddress"];
    $logger->info("Removing $emailAddress");
    my $result = $email->api1_request('delforward', $params);
});