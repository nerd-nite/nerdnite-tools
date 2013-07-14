#!/usr/bin/env perl
use strict;
use warnings;
use NerdNite::Email;

use JSON;
use Carp;
use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Readonly;
use Data::Dumper;
use Underscore;
use Log::Log4perl;


Readonly my $DEFAULT_QUOTA => 250;

Log::Log4perl::init('./perlLogging.conf');

my $logger = Log::Log4perl->get_logger('com.nerdnite.tools.removeBoss');

my $boss_name = shift || croak "Please provide a boss name: foo -> foo\@nerdnite.com\n";
my $bossEmail = "$boss_name\@nerdnite.com";

my $emailChecker = NerdNite::Email->new();

my $pops     = _($emailChecker->request('listpops'))->select(sub {
    my $email = shift;
    return $email->{email} eq $bossEmail;
});

my $forwards = _($emailChecker->request('listforwards'))->select(sub {
    my $email = shift;
    return $email->{dest} eq $bossEmail || $email->{forward} eq $bossEmail;
});

my $detected = scalar @{$pops} + scalar @{$forwards};

if(scalar @{$pops} > 0) {
    $logger->info("Identified '$bossEmail' as a POP address");
    my $result = $emailChecker->request('delpop', { domain => 'nerdnite.com', email => $boss_name});
    print Dumper($result);
}

if(scalar @{$forwards} > 0) {
    $logger->info("Identified '$bossEmail' as being associated with a forwarding address");
    _($forwards)->forEach(sub {
        my $forward = shift;
        my $params = [ $forward->{dest}.'='.$forward->{forward}];
        $logger->info("Removing forward from '$forward->{dest}' to '$forward->{forward}'");
        my $result = $emailChecker->api1_request('delforward', $params);
        print Dumper($result);
    });
}

if(!$detected) {
    $logger->warn("Couldn't find $bossEmail; finishing without deleting");
}

