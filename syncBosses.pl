#!/usr/bin/env perl

use strict;
use warnings;
use CpanelEmail;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;

my $email = CpanelEmail->new(1);

my $pops     = $email->request('listpops');
my $forwards = $email->request('listforwards');

my %IGNORES = map { ("$_\@nerdnite.com" => 1) } (qw(web test sales letters magazine dan_test atx-paypal));
my @bossesTargets;

_->each($forwards, sub {
    my $forward = shift;
    if($forward->{dest} eq 'bosses@nerdnite.com') {
        push @bossesTargets, $forward->{forward};
    }
});

my $emails = _->union(_->pluck($pops, 'email'), _->pluck($forwards, 'dest'));
$emails = _->sort($emails);

$emails = _->filter($emails => sub {
    my $email = shift;
    ($email !~ /^love/) &&
    ($email !~ /^boss(?:es)?\@/) &&
    ($email =~ /\@nerdnite\.com/) &&
    !$IGNORES{$email};
});

my $missing = _->without($emails, @bossesTargets);

print Dumper($emails);

print Dumper(\@bossesTargets);

print Dumper($missing);