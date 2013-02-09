#!/usr/bin/env perl

use strict;
use warnings;
use NerdNite::Email;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;
use Log::Log4perl;
use YAML;

my $blacklist = YAML::LoadFile('bosses.blacklist.yaml');

Readonly my %IGNORES => map { ("$_\@nerdnite.com" => 1) } @{$blacklist};

my $nnEmail = NerdNite::Email->new();
Log::Log4perl::init('./perlLogging.conf');

my $logger = Log::Log4perl->get_logger('com.nerdnite.tools.syncBosses');

$logger->info('Generating the list of all email accounts');
my $emails = $nnEmail->getAllEmails();

$logger->info('Gathering bosses@nerdnite.com Forwarders');
my $forwards = $nnEmail->request('listforwards');
my @bossesTargets;

_->each($forwards, sub {
    my $forward = shift;
    if($forward->{dest} eq 'bosses@nerdnite.com') {
        push @bossesTargets, $forward->{forward};
    }
});

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
    $logger->info("Adding $emailAddress");
    my $result = $nnEmail->addForward( 'bosses' => $emailAddress );
});

$logger->info('Removing excess forwards '.(scalar @$toRemove));
_->each($toRemove, sub {
    my $emailAddress = shift;
    my $params = [ "bosses\@nerdnite.com=$emailAddress"];
    $logger->info("Removing $emailAddress");
    my $result = $nnEmail->api1_request('delforward', $params);
});