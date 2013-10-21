#!/usr/bin/env perl

use strict;
use warnings;
use NerdNite::Email;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;
use JSON;

my $email = NerdNite::Email->new();

my $details = shift || 0;

my $pops     = $email->request('listpops');
my $forwards = $email->request('listforwards');

my $emails = [];

if ($details) {
    push @$emails, $pops;
    push @$emails, $forwards;
}
else {
    $emails = _->union(_->pluck($pops, 'email'), _->pluck($forwards, 'dest'));
    $emails = _->sort($emails);
}

print to_json($emails);
